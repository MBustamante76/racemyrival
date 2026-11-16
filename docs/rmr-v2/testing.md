# V2 testing

## Automated

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Key V2 suites:

- `tests/server/shared-race.test.ts` — persistence, opaque ids, validation, exact replay maths
- `tests/components/shared-race-landing.test.tsx` — spoiler-safe landing, Watch Race, unavailable
- `tests/partners/campaigns.test.ts` — campaign config, asset picking, safe URLs
- Existing Phase 1–2 race engine / UI regression suites remain required

## Canonical manual fixture

JAVI 2:24.00 vs JOEY 2:28.00 over 800m — share → private window → Watch Race → same winner.

## Responsive matrix

320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 — no horizontal scroll; side ad below race on narrow widths.
