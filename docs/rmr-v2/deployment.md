# Deployment

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Production | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Redis REST token |
| `SHARED_RACE_TTL_SECONDS` | Optional | Default 7776000 (90 days) when Redis is used |

Without Redis env vars, an in-memory store is used (local/dev/tests only — **not** for production multi-instance).

## Vercel

1. Deploy preview/staging first.
2. Add Upstash Redis (Marketplace or Upstash console) and wire env vars.
3. Confirm `/api/races` POST and `/race/[id]` on the preview URL.
4. Production only after final checkpoint approval.

## Rollback

- Revert the V2 deployment on Vercel.
- Shared race records remain in Redis until TTL/deletion; homepage race UX does not require them.
- Set `ACTIVE_CAMPAIGN_ID = null` to disable partner creatives without rolling back sharing.

## Ongoing cost

Upstash free tier is typically enough early. Paid usage begins if command volume or storage exceeds the free plan. No other new SaaS is required for V2 core.
