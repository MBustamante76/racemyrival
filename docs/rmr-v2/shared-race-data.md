# Shared race data

## Schema

```ts
type SharedRace = {
  id: string
  schemaVersion: 1
  distanceId: string
  distanceM: number
  competitorA: { displayName: string; finishTimeMs: number }
  competitorB: { displayName: string; finishTimeMs: number }
  simulationVersion: string // "rmr-pace-v1"
  campaignId: string | null
  createdAt: string // ISO-8601
}
```

## Stored vs derived

| Stored | Derived at replay |
|--------|-------------------|
| distanceId, distanceM | winner / tie |
| display names | time gap |
| finishTimeMs (both) | distance gap / ghost |
| simulationVersion | lap labels |
| campaignId | track geometry from distance |
| createdAt, opaque id | |

## Validation (server)

- Non-empty display names after trim; max length 40
- finishTimeMs &gt; 0, finite, within sane upper bound
- distanceId must match a known `RACE_DISTANCES` entry and distanceM must match
- Reject HTML-heavy / control characters in names (strip tags; allow letters, marks, spaces, apostrophes, hyphens)

## Deletion

- Redis `DEL race:<id>`
- Missing key → friendly “This race is no longer available.”
