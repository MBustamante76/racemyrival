# Analytics events (V2)

Platform: Vercel Web Analytics (`@vercel/analytics`). Never send competitor names, emails, or finish times.

## Existing

| Event | Trigger | Properties |
|-------|---------|------------|
| Race Started | Home race start | distanceId, distanceM, playbackRate |
| Race Completed | Home race finished | distanceId, distanceM, playbackRate |
| Replay | Replay pressed | distanceId, distanceM |
| Race Again | Race again pressed | distanceId, distanceM |
| Playback Speed | Rate change | playbackRate, distanceId |
| Share Result | Legacy helper | distanceId, distanceM |

## Share funnel

| Event | Trigger | Measured? | Properties |
|-------|---------|-----------|------------|
| share_opened | User opens share UI | Yes | distanceId, distanceM, raceId?, shareSurface? |
| share_initiated | Native share sheet presented | Yes — sheet opened only | distanceId, distanceM, raceId?, shareSurface? |
| share_completed | `navigator.share()` resolved | **Inferred** — not proof of send | same |
| link_copied | Clipboard write succeeded | Yes | distanceId, distanceM, raceId? |
| shared_race_opened | Shared landing mounted | Yes | raceId, distanceId, distanceM |
| shared_race_started | Shared watch begins | Yes | raceId, distanceId, distanceM, playbackRate |
| shared_race_completed | Shared race finished | Yes | raceId, distanceId, distanceM, playbackRate |
| follow_on_race_created | Create New Race | Yes | distanceId, distanceM, sourceRaceId? |
| follow_on_race_shared | Reserved for follow-on share | Yes | distanceId, distanceM, sourceRaceId?, raceId? |

**Important:** Opening or completing the browser share sheet does **not** prove the recipient received the race. Cancelled shares must not fire `share_completed`.

## Partner

| Event | Trigger | Properties |
|-------|---------|------------|
| partner_impression | Placement ≥50% visible once per mount | campaignId, placement, viewport |
| partner_click | Partner link clicked | campaignId, placement, destination |
