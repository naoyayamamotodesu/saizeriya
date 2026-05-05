# Manus Prompt: Betterzeriya AI Chat Upgrade

GitHub repository:
https://github.com/pnsk-lab/saizeriya

Target app:
`apps/betterzeriya`

Please modify the existing SvelteKit app. Keep the current stack and project style:

- SvelteKit
- Tailwind CSS / existing global CSS
- Bun
- Existing API routes under `src/routes/api`
- Google Gemini via `@google/genai`

## Goal

Turn Betterzeriya into a smarter Saizeriya ordering assistant.

The app should let users talk with an AI chat assistant while ordering. The AI should help users decide what to order, compare menu combinations, estimate calories and nutrition-style details, and recommend menu sets based on their taste, budget, party size, and current cart.

The AI must only advise and prepare suggestions. It must not directly submit orders, call staff, call dessert, or confirm checkout. Those actions must remain explicit user actions with confirmation UI.

## Desired User Experience

Add a polished `AI相談` experience inside the order session screen.

The screen should feel like a premium streaming-app-style food discovery experience, adapted for restaurant ordering. Think “Netflix-like browsing patterns for menu recommendations,” without copying Netflix branding, logos, or exact visuals.

Important UX qualities:

- Fast on mobile
- Easy to use one-handed
- Cart total always visible
- AI suggestions easy to turn into cart actions
- Clear distinction between “AI recommendation” and “actual order”
- Friendly Japanese copy
- Cinematic, premium, energetic, and still practical in a real restaurant

## AI Chat Features

The AI chat should support these use cases:

1. Menu consultation
   - “2人で2000円くらい”
   - “軽めにしたい”
   - “肉多めで”
   - “デザート込みでおすすめ”
   - “今のカートに足すなら？”

2. Recommended combinations
   - Show recommended sets such as:
     - バランスセット
     - コスパ重視セット
     - しっかり満腹セット
     - デザート込みセット
   - Each set should include menu names, item codes, estimated total price, and why it fits.

3. Calories and nutrition-style info
   - If exact calorie data is unavailable, clearly label it as estimated.
   - Show estimated calories per item and per set.
   - Optionally show rough tags:
     - 軽め
     - がっつり
     - シェア向き
     - 野菜あり
     - デザートあり
     - 高たんぱく寄り
   - Do not pretend estimates are official nutrition facts.

4. Cart-aware advice
   - The AI should receive current cart items, quantities, total price, people count, and visible menu context.
   - It should suggest additions or swaps based on what is already in the cart.

5. Actionable suggestions
   - When the AI suggests items, render them as structured recommendation cards, not only plain chat text.
   - Cards should show:
     - Set name
     - Estimated total price
     - Estimated calories
     - Included items with 4-digit codes
     - “カートに追加” button
   - Pressing “カートに追加” should add those items to the local cart only.
   - The user must still press the normal order submit button after reviewing the cart.

## Safety Rules

Real-world actions must require explicit confirmation:

- Order submit
- Staff call
- Dessert call
- Checkout / receipt display

The AI must not say an order has been placed unless the actual order submit endpoint succeeds.

The AI must not invent official data. If nutrition or calories are estimated, display “推定”.

The AI must not invent unavailable item codes. Prefer using item codes from the provided local menu data or official lookup.

## Suggested UI Layout

Mobile-first layout:

- Top header:
  - Table number
  - People count
  - Cart total

- Main AI discovery area:
  - Large featured recommendation panel at the top, like a streaming app hero row
  - Example hero: “あなたにおすすめ: 2人で2000円バランスセット”
  - Show total price, estimated calories, tags, and a strong “カートに追加” action
  - Show secondary action: “理由を見る” or “別の組み合わせ”

- AI chat area:
  - Assistant welcome message
  - Prompt chips:
    - “2人で2000円以内”
    - “軽めにおすすめ”
    - “デザート込み”
    - “今のカートに足すなら”
  - Chat bubbles
  - Structured recommendation cards

- Recommendation shelves:
  - Horizontal scrolling sections similar to a streaming app:
    - あなたにおすすめ
    - 予算別セット
    - がっつり食べたい
    - 軽め・ヘルシー寄り
    - デザート込み
    - みんなでシェア
  - Each card should be image-forward, compact, and tappable.
  - Cards should show title, total price, estimated calories, and 2-3 included item names.

- Bottom fixed compose area:
  - Text input
  - Send button
  - Cart summary strip

Desktop layout:

- Left navigation tabs
- Center cinematic AI recommendation canvas
- Right sticky cart summary
- Horizontal shelves should remain easy to scan with mouse/trackpad.

## Visual Direction

Use a premium dark food-discovery UI inspired by streaming services.

Suggested feel:

- Dark charcoal background, not pure black everywhere
- Deep red accent for featured recommendations and primary highlights
- Saizeriya-like green only for safe positive actions such as “カートに追加”
- Food imagery should be large and appetizing
- Recommendation cards should feel like movie thumbnails, but for menu sets
- Strong contrast, large readable titles, compact metadata
- 8px border radius
- Dense but comfortable spacing for in-store use
- No giant landing-page hero
- No decorative gradient blobs
- No Netflix logo, no copied Netflix assets, no trademarked wording

Design patterns to use:

- Featured “今日のおすすめ” panel
- Horizontal recommendation carousels
- Poster-like set cards
- Hover/focus lift on desktop
- Bottom sheet cart summary on mobile
- Subtle skeleton loading states
- Clear selected/active states

Do not make it look like a generic SaaS dashboard. It should feel like opening a premium recommendation app for food, while still being safe and functional for real ordering.

## Example Screen Concept

AI相談 screen:

- Header:
  - “Table 12”
  - “2名”
  - “カート ¥1,450”

- Featured panel:
  - Title: “あなたにおすすめ”
  - Set: “2人で2000円バランスセット”
  - Items:
    - 3001 ミラノ風ドリア
    - 1205 小エビのサラダ
    - 2202 辛味チキン
  - Estimated total: “約 ¥1,850”
  - Estimated calories: “推定 1,450 kcal”
  - Tags: “シェア向き”, “定番”, “満足感”
  - Button: “カートに追加”

- Shelves:
  - “あなたにおすすめ”
  - “1000円以下”
  - “2人でシェア”
  - “デザートまで楽しむ”

- AI chat:
  - User: “軽めでおすすめある？”
  - AI: “小エビのサラダとスープ系を中心にすると軽めです。カートの合計も抑えられます。”

The user should feel like they are browsing curated food combinations, not reading a plain chatbot transcript.

## Implementation Notes

There is already a simple Gemini endpoint at:

`src/routes/api/chat/+server.ts`

It expects:

- `messages`
- `peopleCount`
- `cartContext`
- `menuContext`

Improve this endpoint so it can return structured JSON recommendations in addition to a normal text reply.

Recommended response shape:

```ts
type AIChatResponse = {
  reply: string
  recommendations?: Array<{
    title: string
    reason: string
    estimatedTotalPrice: number
    estimatedCalories?: number
    items: Array<{
      code: string
      name: string
      price: number
      estimatedCalories?: number
      count: number
    }>
    tags: string[]
  }>
}
```

If Gemini returns invalid JSON, fall back to a plain text reply instead of breaking the UI.

Add a lightweight local calorie estimate map if official data is not available. Keep the wording honest:

- “推定カロリー”
- “目安”
- “公式栄養情報ではありません”

## Acceptance Criteria

- `bun run check` passes
- `bun run build` passes
- AI chat appears as a first-class `AI相談` tab
- User can ask for menu recommendations
- AI can show recommendation cards
- Recommendation cards can add items to the local cart
- Order submission still requires user review
- API key stays server-side as `GEMINI_API_KEY`
- `.env.example` documents required env vars

## Example End User Flow

1. User scans Saizeriya QR code.
2. User opens `AI相談`.
3. User taps “2人で2000円以内”.
4. AI shows 2 or 3 recommended combinations.
5. User taps “カートに追加” on one recommendation.
6. User reviews cart.
7. User explicitly submits the order.
