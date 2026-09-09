# Race My Rival

Phase 1 prototype for an interactive athletics race comparison visualiser.

Enter two finishing times for a race distance. Start moves two markers around a
400m SVG track at each athlete's constant average pace so the physical gap is
visible. Phase 1 (two athletes, shared clock, comparison lanes, result panel) is
complete. Client follow-ups on this branch include path-accurate 100/200/300m
marks, a clock that clamps to the last finish, split min/sec/100ths time fields,
1x–8x playback, and a winner-gap ghost marker.

See `PROTOTYPE_TEST_REPORT.md` for the current test status and deferred V1 work.

## Stack

- Next.js (App Router)
- React
- TypeScript
- SVG (later)
- Vitest and React Testing Library
- Vercel-compatible

## Scripts

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Docker

View the app at http://localhost:3000:

```bash
docker compose up --build
```

Run the test suite in a container:

```bash
docker compose --profile test run --rm test
```

Typecheck, lint, or build the same way:

```bash
docker compose run --rm app npm run typecheck
docker compose run --rm app npm run lint
docker compose run --rm app npm run build
```
