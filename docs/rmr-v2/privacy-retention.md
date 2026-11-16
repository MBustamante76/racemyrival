# Privacy and retention

## Principles

Race My Rival may be used by young athletes. Minimise stored data; avoid a public archive.

- Display names only — no surname field, email, DOB, or accounts for the share flow.
- Opaque race IDs; shared pages `noindex`; no browse/search UI.
- Analytics: race id, distance, device category, campaign/placement — never competitor names.
- UI copy: “Only enter names you are happy to share.”

This is a product requirement, not legal advice. Flag specialist privacy review if consent/cookie policy needs formal update for Redis persistence.

## Retention recommendation

| Policy | Detail |
|--------|--------|
| Default TTL | 90 days from create (`SHARED_RACE_TTL_SECONDS=7776000`) |
| Deletion | `DEL race:<id>` in Redis; missing key → friendly unavailable page |
| No archive | No list/search endpoints |

TTL is applied when Redis credentials are present. In-memory test store does not expire unless tests clear it.
