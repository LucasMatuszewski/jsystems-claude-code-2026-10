# Design Guidelines — x-kom

Extracted from https://www.x-kom.pl/ on 2026-10-20 (desktop viewport 1440 px, after accepting cookies). Values are computed styles from the live page; machine-readable tokens live in [`assets/design-tokens.json`](../assets/design-tokens.json).

## Assets

| Asset | Path | Notes |
|---|---|---|
| Homepage screenshot | [`../assets/homepage.png`](../assets/homepage.png) | Full page, no overlays; visual reference for QA |
| Logo (SVG) | [`../assets/logo.svg`](../assets/logo.svg) | Wordmark "x-kom", viewBox 217.77×38 |
| Favicon | [`../assets/favicon.ico`](../assets/favicon.ico) | |
| Font | [`../assets/fonts/instrument-sans/InstrumentSans-Variable.woff2`](../assets/fonts/instrument-sans/InstrumentSans-Variable.woff2) | Instrument Sans variable (wght 400–700) |
| Tokens | [`../assets/design-tokens.json`](../assets/design-tokens.json) | |

> Logo, favicon and font were downloaded from x-kom. Verify usage rights before using or redistributing them.

## Colors

The UI is almost monochrome: white surfaces, near-black text and a near-black primary button. The brand's colorful gradient appears only in the logo and in promotional artwork. Saturated colors carry meaning: green = price/discount, violet = special promo.

| Token | Hex | Usage |
|---|---|---|
| `brand.primary` | `#222222` | Primary buttons ("Kup teraz", "Zapisz się"), top promo bar |
| `brand.accent` | `#0082FA` | Logo blue; occasional accent / focus |
| `brand.link` | `#0070CC` | Inline text links |
| `brand.promo` | `#6930F0` | "Legendarna zniżka" labels and promo price deltas |
| `brand.success` | `#007D00` | Discounted prices, "Z kodem" badges, savings |
| `brand.error` | `#BE0064` | Not observed on the homepage; derived from logo magenta |
| `logoGradient` | `#0FD2FF → #0082FA → #8250FA → #C382FA → #FA0064 → #BE0064` | Logo mark only; may be used for decorative accents |
| `background.default` | `#FFFFFF` | Page, header, cards |
| `background.light` | `#F7F7F7` | Footer, subtle sections |
| `background.input` | `#F2F2F2` | Search field |
| `background.successLight` | `#EEF7ED` | Success/discount badge fill |
| `background.promoLight` | `#F4F0FF` | Promo badge fill |
| `background.infoLight` | `#F0F8FF` | Info panels |
| `text.primary` | `#1A1A1A` | Body text, headings, nav |
| `text.secondary` | `#444444` | Secondary actions, icons |
| `text.muted` | `#6E6E6E` | Meta text, "Najniższa cena z 30 dni", timers |
| `text.onDark` | `#FFFFFF` | Text on `#222222` |
| `border.default` / `light` | `#DDDDDD` / `#EBEBEB` | Dividers |
| `border.strong` | `rgba(0,0,0,0.64)` | Outline buttons |

## Typography

- **Family:** `"Instrument Sans", sans-serif` is used everywhere; there is no separate heading font.
- **@font-face** (self-hosted copy in this repo):

```css
@font-face {
  font-family: "Instrument Sans";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  font-variation-settings: "wdth" 100;
  src: url("/assets/fonts/instrument-sans/InstrumentSans-Variable.woff2") format("woff2");
}
```

- **Downloaded file:** `assets/fonts/instrument-sans/InstrumentSans-Variable.woff2` (renamed from `InstrumentSans-VariableFont_wdth,wght.woff2`). Instrument Sans is published as an open-source family (SIL OFL), but verify the license before shipping.

| Role | Size / line height | Weight |
|---|---|---|
| Page title (h1) | 28px / normal | 700 |
| Section heading (h2, e.g. "Hity tygodnia") | 26px / 32px | 600 |
| Nav / large button | 16px / 22px | 400 |
| Body, product title, buttons | 14px / 20px | 400 |
| Badges, small meta | 13px / 16px | 400 |

Weights: 400 regular, 600 semibold, 700 bold. Body text is regular 400; emphasis comes from size rather than weight.

## Spacing

Base unit **4px**. Observed values: 4, 8, 12, 16, 20, 24, 32, 40px. Typical paddings: buttons `12px 24px` (large) / `8px 14px` (small), nav items `8px 12px`, search input `8px 0 8px 20px`.

## Border radius

| Token | Value | Usage |
|---|---|---|
| `xs` | 2px | Tiny indicators |
| `sm` | 4px | Badges ("Z kodem", price deltas) |
| `md` | 8px | **Default:** buttons, search, inputs, banners |
| `lg` | 12px | Product cards, tiles |
| `circle` | 50% | Category icons, avatars |

## Components

- **Promo bar:** full-width strip above the header, `#222222` background, white 14px text, 40px tall (e.g. "Trwa Black Weeks. Zgarnij rabaty do 65%.").
- **Header:** white, 72px main row, soft shadow `0 2px 4px rgba(0,0,0,.08), 0 0 2px 1px rgba(0,0,0,.08)`. Layout: logo left (218×40), search center, account/cart icons right with 13px labels.
- **Search:** `#F2F2F2` fill, radius 8px, height 40px, no border, placeholder 14px.
- **Nav (category bar):** 16px regular `#1A1A1A`, item padding `8px 12px`, 56px tall, icon above label.
- **Primary button:** `#222222` / white, radius 8px, 48px (16px text, `12px 24px`) or 40px (14px text, `8px 40px`).
- **Outline button:** transparent, `1px solid rgba(0,0,0,.64)`, radius 8px, 36px tall, 14px text (e.g. "Sprawdź").
- **Ghost button:** transparent, `#444444` text, used for "Pokaż wszystkie".
- **Badges:** radius 4px, 13px text; success `#EEF7ED` / `#007D00`, promo `#F4F0FF` / `#6930F0`.
- **Product card:** no visible border/background, radius 12px, 216px wide; image, 14px title, price in bold large digits (green when discounted), lowest-30-day price in muted text.
- **Footer:** `#F7F7F7` background, link columns in 14px.

For an AI chat UI: use white surfaces, `#F2F2F2` for the composer input (radius 8px), `#222222` for the send button and the user's message bubbles with white text, and `#F7F7F7` for assistant bubbles.

## Logo usage

- Use `assets/logo.svg` in the top-left of the header at about 218×40px (height 32–40px), linked to home.
- The letters use `fill: var(--color-full, #000)`. On dark backgrounds set `--color-full: #fff` on a parent to get the inverted variant; the gradient mark stays unchanged. No separate inverted file is needed.
- Keep clear space of at least the height of the "x" around the logo, and do not recolor the gradient.

## Visual style summary

x-kom looks clean, retail-first and technical. The interface is restrained: white space, a single neutral sans (Instrument Sans) and near-black controls, so product photos and promo banners carry the color. The vivid cyan→violet→magenta gradient of the logo is the brand's energy signature and appears in campaign artwork, not in UI chrome. Consistent 8px radii and soft shadows give a modern, friendly feel without decoration. Color is functional: green means savings, violet means special deals.
