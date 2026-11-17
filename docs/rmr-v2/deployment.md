# Deployment

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Staging + production | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Staging + production | Redis REST token |
| `SHARED_RACE_TTL_SECONDS` | Optional | Default 7776000 (90 days) when Redis is used |

Without Redis env vars, an in-memory store is used (local/dev/tests only — **not** for staging or production multi-instance).

**WhatsApp / OG titles:** crawlers call `generateMetadata` on `/race/[id]`. That lookup needs the same Redis as create. Staging preview **must** set both Upstash vars; otherwise shared races disappear after cold start / across instances and scrapers fall back to a neutral “Race My Rival” title (page body still shows unavailable). After Redis is live, re-test with Facebook Sharing Debugger / a fresh race URL (WhatsApp caches aggressively).

## Vercel

1. Deploy preview/staging first.
2. Add Upstash Redis (Marketplace or Upstash console) and wire env vars on **preview and production**.
3. Confirm `/api/races` POST and `/race/[id]` on the preview URL (create a race, open the link in a private window, check `<title>` / OG).
4. Production only after final checkpoint approval.

## Rollback

- Revert the V2 deployment on Vercel.
- Shared race records remain in Redis until TTL/deletion; homepage race UX does not require them.
- Set `ACTIVE_CAMPAIGN_ID = null` to disable partner creatives without rolling back sharing.

## Ongoing cost

Upstash free tier is typically enough early. Paid usage begins if command volume or storage exceeds the free plan. No other new SaaS is required for V2 core.
