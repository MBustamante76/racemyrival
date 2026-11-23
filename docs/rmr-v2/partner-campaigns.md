# Partner campaigns

## Configuration

Central typed campaigns live in `src/partners/campaigns.ts`.

- `ACTIVE_CAMPAIGN_ID` — `"run-lab"` | `"test-partner"` | `null`
- `getActiveCampaign()` — returns null when inactive / out of date window / null id
- Race engine components do not import partner assets directly; UI uses `PartnerShell` / `PartnerBanner`

## Placements

| Slot | Desktop | Mobile |
|------|---------|--------|
| top | Under RmR header (wide creative) | Portrait / landscape creatives |
| side | Beside race (≥ lg) | Hidden (no mobile side creative) |
| lower | Wide bottom creative | Compact on portrait; wide on landscape |
| socialCard | OG attribution text | Same |

## No-campaign mode

Set `ACTIVE_CAMPAIGN_ID = null`. No empty ad shells; race UX unchanged; OG image still works without partner line.

## Impression rule

`IntersectionObserver` with threshold 0.5; one impression per placement mount (ref guard). Not counted merely because the node exists in the DOM.

## Click tracking

Only `https` destinations on an allowlisted host (`src/partners/safeUrl.ts`).

Banner hrefs also receive UTM tags via `withPartnerUtm` (`src/partners/utm.ts`):

| Param | Value |
|-------|--------|
| `utm_source` | `racemyrival` |
| `utm_medium` | `banner` |
| `utm_campaign` | campaign `trackingCode` (fallback: campaign id) |
| `utm_content` | placement: `top` / `side` / `lower` |

Example: `https://running-coach.uk/?utm_source=racemyrival&utm_medium=banner&utm_campaign=run-lab-v2&utm_content=top`
