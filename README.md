# Race My Rival

Polished V1 for an interactive athletics race comparison. Enter two finishing
times, start the race, and watch both athletes move around a 400m SVG stadium
at their constant average pace so the physical gap is visible.

Phase 1 race maths are unchanged. The default UI is the light sports-broadcast
shell. `?mode=wireframe` (or `localStorage` key `rmr-presentation=wireframe`)
shows a zinc-styled presentation of the same engine.

## What V1 is

- Two named athletes, split min / sec / 100ths finishing times
- Full `RACE_DISTANCES` list (100m through 5000m, including the mile)
- Shared `RaceClock` with Start / Pause / Resume / Reset
- Playback 1x / 2x / 4x / 8x, changeable before start and mid-race
- Winner-gap ghost, oval 100/200/300 marks, 100m chute, offset starts
- Infield clock with hundredths and last-finish clamp
- Live distance / speed / gap strip
- Replay (same config, locked form, auto-start) and Race again (idle, editable)
- Result card from the frozen `RaceResult` snapshot

Default 800m fixture: Marcelo `2:04.00` vs Josh `1:52.00` → Josh wins, 12.00s
faster, about **77.419m** ahead at the first finish.

## What V1 is not

Split pacing, official stagger/break, Three.js, accounts, share URLs, social
images, history, multiplayer, analytics, or real athlete photos. Header items
other than RACE are visual placeholders.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind v4 design tokens in `src/app/globals.css` and `src/styles/tokens.ts`
- SVG track renderer over `StadiumTrackGeometry` / `SprintStraightGeometry`
- Vitest + React Testing Library

Domain code does not import React or SVG. Race metres and winner/gap maths
come from `RaceEngine`, `ConstantPaceModel`, and `RaceClock` only.

## Scripts

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Local setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. Wireframe: http://localhost:3000/?mode=wireframe

## Docker

```bash
docker compose up --build
```

Tests:

```bash
docker compose --profile test run --rm test
```

## Vercel

The production build is a static App Router site (`npm run build` / `next start`).
To deploy:

1. Import this GitHub repository in the Vercel dashboard.
2. Framework preset: Next.js. Build command: `npm run build`. Output: default.
3. No environment variables are required for V1.

This repository does not claim a live production URL unless deploy credentials
are present.

## Architecture

```
RaceClock → RaceSimulation → RaceEngine → PaceModel
                              RaceEngine → distanceCoveredM → RaceCourse → SVG
                              RaceEngine → RaceTelemetry → clock / strip / result
```

| Area | Location |
|---|---|
| Race maths | `src/domain/race` |
| Track geometry | `src/domain/track` |
| Animation loop | `src/runtime/createRaceLoop.ts` |
| Polished UI | `src/components` |
| Tests | `tests/` |

## Reports

- Phase 1 evidence: [`PROTOTYPE_TEST_REPORT.md`](PROTOTYPE_TEST_REPORT.md)
- Phase 2 evidence: [`PHASE_2_TEST_REPORT.md`](PHASE_2_TEST_REPORT.md)
