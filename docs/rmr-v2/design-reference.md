# Race My Rival V2 — Design Reference

Source of truth for the live V1 visual system. V2 sharing and partner layers must respect this system. Partner creatives are secondary to Race My Rival identity.

## Primary colours

| Role | Token | Hex |
|------|-------|-----|
| Brand navy | `--rmr-navy` / `brandNavy` | `#0F182F` |
| Near black | `--rmr-near-black` | `#111318` |
| Brand red | `--rmr-red` | `#E10A1F` |
| Brand red hover | `--rmr-red-hover` | `#C9081B` |
| Brand red tint | `--rmr-red-tint` | `#FDECEE` |
| Page | `--rmr-page` | `#FEFEFE` |
| Card | `--rmr-card` | `#FFFFFF` |
| Border | `--rmr-border` | `#EEF0F3` |
| Muted | `--rmr-muted` | `#667085` |
| Gold | `--rmr-gold` | `#D99800` |

## Athlete / track colours

| Role | Hex |
|------|-----|
| Athlete A (You) | `#008C95` |
| Athlete B (Rival) | `#6A50A7` |
| Track surface | `#E15B56` |
| Infield | `#C9D2A1` |
| Lane lines | `#FFFFFF` |

**Note:** V2 mockups often show blue/orange markers. Production uses teal/purple. Preserve the live palette unless the client explicitly approves a change.

## Typography

| Role | Font | Usage |
|------|------|--------|
| UI / body | Inter (`--font-inter`) | Body, controls, results |
| Display | Montserrat (`--font-montserrat`) | Available via `--font-display` |
| Wordmark | Brand SVG pack | Italic “Race My Rival” mark; tagline baked into header asset |

Defined in `src/app/layout.tsx` (Google fonts) and mirrored in `src/app/globals.css` / `src/styles/tokens.ts`.

Site metadata description: **Turn times into races.**

## Logo usage

| Asset | Location | Role |
|-------|----------|------|
| `public/brand/race-my-rival-with-tagline-colour.svg` | `BrandHeader` / wireframe header | Primary on-page brand |
| `public/brand/race-my-rival-wordmark-colour.png` | Shared race OG image | Compact mark on social cards |
| Black / white / reversed variants | `public/brand/` | Future dark / partner surfaces |
| `public/brand/rmr-favicon-with-lines.svg` (+ PNG/ICO sizes) | Favicon / apple icon via `layout.tsx` | Browser chrome |
| `src/app/icon.png` / `apple-icon.png` | App Router icon routes | Next file-based icons (512 / 180) |
| `public/runner-pin-a.png`, `runner-pin-b.png` | Track markers | Athlete pins |

`AppHeader` exists but is gated off (`SHOW_APP_HEADER = false`).

## Buttons

- Primary race action: brand red, white text, rounded-full / bold sans.
- Secondary result actions: bordered card-style pills (`ResultPanel`).
- Focus: `--rmr-athlete-a` outline (`:focus-visible` in `globals.css`).
- Touch targets: prefer `min-h-11` on result actions.

## Track presentation

- SVG stadium oval (non-100m) or sprint straight (100m).
- Red track, pale green infield, white lane lines.
- Infield clock + lap label; distance marks 100/200/300.
- Ghost markers after first finish via `ghostFromSnapshot`.

## Result presentation

- Card with border, shadow (`--rmr-shadow-card`), radius 8px.
- Winner name, times VS, time gap, distance gap at finish.
- CTAs: Replay Race, Challenge a Rival, Create New Race; Share Race is primary.

## Cards / spacing

- Card radius: 8px; control radius: 6px.
- Soft navy-tinted shadows.
- Main shell max width ~1250px; compact padding on mobile; tighter landscape short-height rules.

## Responsive layout

- Mobile-first stacking; setup bottom sheet on small viewports.
- Side partner creative (V2): beside track only when wide; **below race on mobile**.
- No horizontal scroll; overflow-x hidden on presentation root.
- Breakpoint contracts covered by existing tests (`breakpoint-contract`, `phase-2k-responsive`, mobile portrait).

## Desktop vs mobile behaviour

| Concern | Desktop | Mobile |
|---------|---------|--------|
| Setup | Inline `SetupCard` | Bottom sheet |
| Spacebar start/pause | ≥768px | Not used |
| Partner side slot | Beside track when room | Relocate below race |
| Share | Copy Link + native share if available | Prefer native share sheet |
