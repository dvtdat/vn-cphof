# Design System - vn-cphof.com

Captured from SPEC.md §12 (single source of truth) and the live code
(`src/app/globals.css`, `src/lib/fonts.ts`, `src/components/`). Where this file
and SPEC.md disagree, the spec wins.

## Theme

Cool & crisp light theme: a record book printed on bright white stock.
Near-white blue-tinted neutrals, near-black ink, one refreshed blue accent.
No dark mode in Phase 1.

## Color

All tokens live in `globals.css` `@theme` (OKLCH) and are consumed as Tailwind
classes (`bg-paper`, `bg-wash`, `text-ink-soft`, `border-line`, …).

| Token                                         | Value                                                              | Role                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `paper`                                       | `oklch(98.6% .003 250)`                                            | Page background, near-white cool                                         |
| `card`                                        | `oklch(99.6% .0015 250)`                                           | Floating surfaces (dropdowns, dialogs)                                   |
| `wash`                                        | `oklch(96.6% .005 250)`                                            | Borderless surface fill: stat cards, chips, pills, side panels           |
| `ink`                                         | `oklch(22% .014 260)`                                              | Primary text                                                             |
| `ink-soft`                                    | `oklch(50% .016 258)`                                              | Secondary text                                                           |
| `ink-faint`                                   | `oklch(68% .014 256)`                                              | Tertiary, placeholders                                                   |
| `line`                                        | `oklch(92.6% .006 255)`                                            | Hairline dividers, row borders                                           |
| `line-strong`                                 | `oklch(87% .009 255)`                                              | Table header rule only                                                   |
| `accent`                                      | `var(--color-blue)`                                                | THE accent: header bar, links, active states, top-3                      |
| `accent-deep`                                 | `var(--color-blue-strong)`                                         | Accent hover                                                             |
| `accent-soft` / `accent-softer`               | accent at 7% / 4% alpha                                            | Row hover, active tints                                                  |
| `gold` / `silver` / `bronze`                  | `oklch(55% .105 87)` / `oklch(58% .012 260)` / `oklch(55% .09 55)` | Medal tokens; gold is yellow-family, ≥4.5:1 on paper                     |
| `solve` / `solve-strong` / `fail`             | `green-bg` / `green-strong` / `red-bg`                             | ICPC scoreboard cells (AC / first-solve / tried), aliased into the ramps |
| `logo-circle` / `logo-star` / `logo-subtract` | `#FFC40C` / `#F99F1B` / `#FFFFFF`                                  | Logo, themeable via `src/components/logo.tsx`                            |

### Semantic 4-color palette

Flag-anchored hues - red 28 (cờ đỏ), yellow 88 (sao vàng / logo star),
green 148 (solve), blue 256 (the accent). Five steps per ramp, all WCAG AA
verified against their intended pairings:

| Step       | Role                        | Red                    | Green                   | Blue                    | Yellow               |
| ---------- | --------------------------- | ---------------------- | ----------------------- | ----------------------- | -------------------- |
| `*-soft`   | faint tint bg               | `oklch(96.5% .013 28)` | `oklch(96.5% .025 148)` | `oklch(96.5% .015 256)` | `oklch(97% .03 95)`  |
| `*-bg`     | chips, scoreboard cells     | `oklch(91% .045 28)`   | `oklch(91% .07 148)`    | `oklch(91% .04 256)`    | `oklch(93% .075 92)` |
| base       | solids, icons, dots         | `oklch(55% .2 28)`     | `oklch(57% .15 148)`    | `oklch(50% .15 256)`    | `oklch(80% .16 88)`  |
| `*-strong` | hover, borders, first-solve | `oklch(48% .19 28)`    | `oklch(48% .125 148)`   | `oklch(43% .14 256)`    | `oklch(62% .125 87)` |
| `*-deep`   | text on tint / paper        | `oklch(42% .15 28)`    | `oklch(40% .11 148)`    | `oklch(38% .12 256)`    | `oklch(50% .1 86)`   |

**Pairing rules (AA, all verified ≥4.5:1 text / ≥3:1 UI):**

- On a `*-soft` or `*-bg` tint: text is `ink`, `ink-soft`, or that ramp's `*-deep`. Nothing lighter.
- White text only on: `red`, `red-strong`, `green-strong`, `blue`, `blue-strong`.
- **Never white on yellow.** Yellow base is light (L 80%): pair with `ink` or `yellow-deep`. Where yellow needs a ≥3:1 boundary vs paper, use `yellow-strong`.
- `DOT_COLORS` / `AVATAR_COLORS` in `src/components/hof/tokens.tsx` derive from the same logic: dots `oklch(55% ~.12 h)`, avatars `oklch(50% ~.1 h)` (white initials ≥4.5:1); chroma dips on sRGB-narrow hues (86, 200).

Color strategy: **Restrained page, vivid data**. Cool-tinted neutrals + one
blue accent ≤10% of surface; the red/green/yellow ramps appear only as data
encodings (scoreboard, medals, dots, status), never decoration.

**Surface rule: no bordered boxes.** Inline containers (stat cards, chips,
member cards, filter pills) use `bg-wash` fills, no border, hover →
`bg-accent-soft`. Borders are reserved for floating layers (dropdown, command
palette) and table hairlines. Never `border border-line-strong` around a card.

## Typography

- **SVN-Gotham** (local, Vietnamese-complete) - `--font-sans`.
  Book 400 body · Regular 500 labels/nav · Bold 700 names/row emphasis ·
  Black 800 headings, rank numerals, big stats.
- **IBM Plex Mono** - `--font-mono`. Micro-labels (10px uppercase, 1.4px
  tracking, `.label` utility), handles, scores, years. Numeric columns always
  `tabular-nums`.
- Scale: tokenized in `globals.css` `@theme` - the only font sizes allowed in
  JSX. Never use arbitrary `text-[..]` values.

  | Class       | Size   | Role                                        |
  | ----------- | ------ | ------------------------------------------- |
  | `text-3xs`  | 9px    | medal pip letters, scoreboard cell tries    |
  | `text-2xs`  | 10.5px | mono micro-labels, handles, captions        |
  | `text-xs`   | 12px   | secondary table data (Tailwind default)     |
  | `text-body` | 13px   | default body, table cells                   |
  | `text-sm`   | 14px   | bold names, row emphasis (Tailwind default) |
  | `text-md`   | 15px   | emphasized row titles                       |
  | `text-lg`   | 18px   | h3 (Tailwind default)                       |
  | `text-xl`   | 22px   | section numerals                            |
  | `text-stat` | 26px   | big stat numerals                           |
  | `text-3xl`  | 30px   | h1 (Tailwind default)                       |

## Layout

- Container 1180px, desktop-first.
- Real `<table>` semantics for all tabular data.
- Strong grid, hairline dividers, comfortable density. Hierarchy via type
  weight/size, never boxes-in-boxes.

## Components (canonical inventory, build once in `src/components/`)

Medal token (17px pip + G/S/B letter + count) · Department tag (color dot +
name chip) · Person cell (initials avatar + bold name + mono handle) · Rank
cell (800 tabular numeral; top-3 = accent + 3px inset hairline) · Mode tabs
(underline, accent active) · Filter chip (pill + caret) · Search (filter-bar
pill + ⌘K palette) · Stat card (bordered, 800 numeral, mono label) · Timeline
item (left rule, medal dot, mono year) · Track-record table · Verified badge
(`✓ verified` accent pill) · Account chip · Department seal monogram.

## Site header

Accent-blue bar, white text. White subtract-variant logo. Locale-specific
wordmark (EN: "Vietnam | Competitive Programming / HALL OF FAME"; VI: "Việt
Nam / BẢNG VÀNG LẬP TRÌNH THI ĐẤU"). Wide ⌘K search trigger. Locale toggle:
active = white pill, accent text.

## Motion

One-time staggered fade-up on screen entry (`.reveal`, 0.45s,
cubic-bezier(0.2,0.7,0.3,1), ≤0.3s stagger) and row-hover tint. Nothing else.
`prefers-reduced-motion` disables entrances. No scroll-jacking, no parallax.

## Bans (project-specific, on top of impeccable's)

Flat only: no 3D, glassmorphism, skeuomorphism, heavy shadows, busy gradients,
stock-photo heroes. No gamification. Color never the only signal.
