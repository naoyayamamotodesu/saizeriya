import { env } from '$env/dynamic/private'
import { GoogleGenAI } from '@google/genai'
import { json, type RequestHandler } from '@sveltejs/kit'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type MenuContextItem = {
  code: string
  name: string
  price: number
  category: string
}

type CartContextItem = {
  id: string
  name?: string
  price?: number
  count: number
}

const cleanText = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .trim()
    .slice(0, maxLength)

const parseMessages = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((message): ChatMessage | null => {
      const role = message?.role === 'assistant' ? 'assistant' : 'user'
      const content = cleanText(message?.content, 1200)
      return content ? { role, content } : null
    })
    .filter((message): message is ChatMessage => message !== null)
    .slice(-8)
}

const parseMenuContext = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): MenuContextItem | null => {
      const code = cleanText(item?.code, 8)
      const name = cleanText(item?.name, 80)
      if (!/^\d{4}$/.test(code) || !name) {
        return null
      }
      return {
        code,
        name,
        price: Number(item?.price ?? 0),
        category: cleanText(item?.category, 40) || 'メニュー',
      }
    })
    .filter((item): item is MenuContextItem => item !== null)
    .slice(0, 80)
}

const parseCartContext = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): CartContextItem | null => {
      const id = cleanText(item?.id, 8)
      const count = Number(item?.count ?? 0)
      if (!/^\d{4}$/.test(id) || !Number.isInteger(count) || count <= 0) {
        return null
      }
      return {
        id,
        name: cleanText(item?.name, 80) || undefined,
        price: Number(item?.price ?? 0),
        count,
      }
    })
    .filter((item): item is CartContextItem => item !== null)
    .slice(0, 40)
}

export const POST: RequestHandler = async ({ request }) => {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'GEMINI_API_KEY is not set' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const messages = parseMessages(body.messages)
  const menuContext = parseMenuContext(body.menuContext)
  const cartContext = parseCartContext(body.cartContext)
  const peopleCount = Number(body.peopleCount ?? 0)

  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  if (!latestUserMessage) {
    return json({ error: 'Message is required' }, { status: 400 })
  }

  const cartTotal = cartContext.reduce((sum, item) => sum + (item.price ?? 0) * item.count, 0)
  const menuLines = menuContext
    .map((item) => `${item.code} ${item.name} ${item.price}円 ${item.category}`)
    .join('\n')
  const cartLines = cartContext.length
    ? cartContext
        .map((item) => `${item.id} ${item.name ?? '名称不明'} x${item.count} ${item.price ?? 0}円`)
        .join('\n')
    : 'カートは空です'
  const conversation = messages
    .map((message) => `${message.role === 'user' ? 'ユーザー' : 'AI'}: ${message.content}`)
    .join('\n')

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      contents: `
あなたはサイゼリヤ店内注文アプリのAI相談係です。日本語で短く、実用的に答えてください。

守ること:
- 実際の注文送信、店員呼び出し、会計確定を指示・実行したと誤解させない。
- 注文したい場合は「カートに追加して確認してから送信」と案内する。
- メニュー番号が文脈にある場合は、商品名と4桁番号を一緒に出す。
- メニューにない商品番号や価格は作らない。
- 予算、人数、現在のカートを見て、追加候補や組み合わせを提案する。
- 長くても5文程度。必要なら箇条書き。

人数: ${Number.isFinite(peopleCount) && peopleCount > 0 ? `${peopleCount}人` : '不明'}
現在のカート合計: ${cartTotal}円

現在のカート:
${cartLines}

候補メニュー:
${menuLines || '候補メニューなし'}

会話:
${conversation}
      `.trim(),
      config: {
        temperature: 0.7,
      },
    })

    const reply = response.text?.trim()
    if (!reply) {
      return json({ error: 'AI response was empty' }, { status: 502 })
    }

    return json({ reply })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Failed to generate AI response' },
      { status: 502 },
    )
  }
}
