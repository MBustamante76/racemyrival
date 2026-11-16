# Social preview

## Metadata

For shared race `/race/<id>`:

- **title:** `{A} vs {B}`
- **description:** `{distanceLabel} — Who won?`
- **robots:** `noindex, nofollow`
- **Open Graph / Twitter:** large image card

## Image

- Route: `src/app/race/[id]/opengraph-image.tsx`
- Generator: `next/og` `ImageResponse`
- Size: 1200×630
- Content: Race My Rival wordmark, names, distance, “Who won?”, optional campaign attribution from race `campaignId` (fallback: active campaign)
- Never includes winner, times, or gaps

## Caching

- Next.js caches OG images per route/params; social networks (WhatsApp especially) cache aggressively and may keep an older preview after content changes.
- Campaign attribution is snapshotted via `campaignId` on the stored race so later campaign swaps do not rewrite historical cards unless the image is regenerated/cache-busted.
- Avoid regenerating identical images unnecessarily; platform CDN handles revalidation.

## WhatsApp caveats

WhatsApp scrapers may ignore query cache-busters and retain the first successful preview for a URL. Prefer stable URLs; treat preview updates as eventually consistent.
