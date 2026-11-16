# Race My Rival V2 — Architecture

## Overview

V2 adds a sharing, social-preview, analytics, and partner-advertising layer around the existing deterministic race engine. The engine in `src/domain/race` and `src/runtime/createRaceLoop.ts` is reused unchanged for shared replays.

## Components

| Layer | Responsibility |
|-------|----------------|
| Home `/` | Existing create/watch race UX + partner placements |
| `POST /api/races` | Validate payload, persist SharedRace, return opaque id + URL |
| `/race/[id]` | Shared landing (spoiler-safe) → Watch Race → same engine |
| `/race/[id]/opengraph-image` | Dynamic OG image via `next/og` |
| Upstash Redis | Key/value store for SharedRace JSON |
| Partner config | Typed campaign object; placements independent of race maths |
| Analytics | Extended `@vercel/analytics` events (no PII names) |

## Replay integrity

Store only race **inputs**. Recompute winner, gaps, laps, and ghost via existing `RaceEngine` / `createConfiguredRace`. Include `simulationVersion` so future pace-model changes can be gated.

## Identifier

Opaque `nanoid` (21 chars). Public URL: `/race/<id>`. No sequential integers, names, or times in the URL.

## Persistence

**Upstash Redis** (`@upstash/redis`) via REST.

- Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Key pattern: `race:<id>`
- Local/test fallback: in-memory map when Redis env is absent (never use in production)

## Retention (proposed)

90-day Redis TTL after create, plus documented delete-by-key. TTL is enabled once approved; default implementation sets TTL when `SHARED_RACE_TTL_SECONDS` is set (default 7776000 = 90 days in production config docs).

## Deployment

Requires Vercel (or compatible) Node/serverful Next.js hosting — not a static export. Preview/staging before production.
