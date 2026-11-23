# Race My Rival V2 — Sharing Flow

## Product loop

1. User creates a race (names + distance + finishing times).
2. User watches the race on the existing engine.
3. Race finishes; result panel shows winner, times, gaps.
4. User selects **Share Race**.
5. Server creates a stable opaque URL for that exact race.
6. User shares via native share sheet and/or **Copy Link**.
7. Recipient sees race-specific social preview (curiosity, no winner).
8. Recipient opens `/race/<opaque-id>`.
9. Landing shows both names and distance; **not** the winner.
10. Recipient chooses **Watch Race**.
11. Exact race plays via the same race engine.
12. After watching: Replay, Race Again, Create New Race, Share Race.

Shared experience must feel personal — never dump the recipient on the generic homepage without race context.

## Canonical fixture

| Competitor | Name | Distance | Time |
|------------|------|----------|------|
| A | JAVI | 800m | 2:24.00 |
| B | JOEY | 800m | 2:28.00 |

Expected winner after playback: JAVI. Preview and pre-watch landing must **not** reveal this.

## Spoiler rules

### Social preview (OG / WhatsApp)

Show:

- Competitor A vs Competitor B
- Distance
- Curiosity prompt: **Who won?**
- Race My Rival identity
- Optional restrained partner line (e.g. Powered by Run-Lab)

Do **not** show: winner, times, gap, result.

Target image ~1200×630. Crawler-retrievable (server/`next/og`), not a browser-only screenshot.

### Shared landing (before Watch Race)

Show: names, distance, branding, Watch Race CTA.  
Hide: winner, times, result, time gap, distance gap.

### After Watch Race

Reveal result using existing result logic; offer share / replay / challenge actions.

## Privacy notes

- Display names only; prompt: “Only enter names you are happy to share.”
- Opaque non-sequential IDs; no public archive; `noindex` on shared pages.
- Analytics must not send competitor names.

## Required vs optional graphics

| Required V2 | Not in this milestone |
|-------------|------------------------|
| Dynamic Open Graph / WhatsApp preview | Downloadable Instagram/result cards |
| | Animated race/video exports |
