# Race My Rival — Phase 1 prototype test report

## Identity

| Field | Value |
|---|---|
| Date / time | 2026-09-07 10:42 +01:00 |
| Branch | `phase-01` |
| Commit | `29507eb` (report written after local Phase J layout changes; those files were not yet committed) |
| Environment | Windows 10, Docker Desktop, `racemyrival-app` on http://localhost:3000, Next.js 16.3.4, React 19.2.8, Vitest 5 |
| Vercel | Not connected |

## Automated results

| Command | Result |
|---|---|
| `npm test` | Pass — 12 files, **91 tests** |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |

No NaN / Infinity in domain or UI smoke checks. Output is deterministic under injected frame time.

## Manual smoke tests

Checked in the browser at **390×844** (J) and **1280×800** (K). No horizontal overflow (`scrollWidth === clientWidth`). SVG `viewBox` identical at both widths (`-91.165934 -48.5 182.331868 97`). `preserveAspectRatio="xMidYMid meet"`. No `window` error events.

| ID | Scenario | Result |
|---|---|---|
| A | 400m, 1.00 vs 0.80 | Josh wins, 0.20s faster, ~80m snapshot gap. Start / Finish same line. Both pin at 400m. |
| B | 800m `2:04.00` vs `1:52.00` | Live: Josh ahead at 6.81s (48.67m vs 43.96m), no result panel yet, no NaN. Full finish / 12.00s / ~77m covered by automated Phase A/F/I tests (124s wall-clock not waited). |
| C | Equal-time 800m (1.00 vs 1.00) | Dead heat. Both 800m. |
| D | 1500m | Separate green start tick, finish labelled Finish. Short 1.00/1.00 run completed; both at 1500m. |
| E | 3000m | Separate start tick. Short run completed; both at 3000m. |
| F | Pause / resume | Pause at 9.21s froze clock and distance; Resume is shown and was used earlier in Phase H/I. |
| G | Reset while racing | Returned idle, 0%, Start enabled. |
| H | Reset while paused | Returned idle, 0%, form unlocked. |
| I | Reset after completed race | Result panel removed, idle. |
| J | Mobile 390×844 | Form stacked, Start usable, no overflow, track scrolls into view and keeps aspect. |
| K | Desktop 1280×800 | Two-column athlete fields, no overflow, same viewBox / marker distances. |

Also verified: winner stays at finish; second runner continues (Phase H/I live + A mid-race automated); marker wrap is lap geometry, not teleport.

## Known limitations

- Wireframe only. Not the later polished UI.
- Comparison lanes only. Official stagger is a factory stub.
- Constant average pace only. No split pacing.
- 800m fixture full live duration was not wall-clocked in this session; maths are automated.
- Result copy uses “he”.
- `completedLaps` is `floor(distance / 400)` (3000m finish shows 7).
- Hidden tab pauses; it does not auto-resume.

## Deferred work

Exact staggered starts and split-based pacing remain future work. So do Three.js, backend, auth, N-runner UI, replay, and 1x/2x/4x playback.
