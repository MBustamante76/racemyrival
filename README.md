# Race My Rival

Phase 1 prototype for an interactive athletics race comparison visualiser.

A user will enter two finishing times for a race distance. START will move two
markers around a 400m SVG track at each athlete's constant average pace so the
physical gap is visible. This repository is currently the toolchain scaffold
only; race maths, track geometry, and the wireframe UI are not implemented yet.

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
