# Race My Rival V2 — Partner Assets

Inventory of the simplified Run-Lab advertising pack (6 creatives) and the placement mapping used for V2.

**Source folder:** `NEW_-_BANNERS.zip` (client Downloads pack).  
**Destination URL (all placements):** `https://running-coach.uk/`  
**Selection rule:** choose artwork by **viewport width** (`window.innerWidth` / `<picture>` media), not device UA and not the capped advert container (~1250px). Do not stretch or cover-crop.

Suggested width bands:

| Band | Width | Top | Bottom |
|------|-------|-----|--------|
| Compact / mobile portrait | ≤ 599px | Mobile portrait | Compact (stacked) |
| Mobile landscape | 600–899px | Mobile landscape | Wide |
| Wide (tablet + desktop) | ≥ 900px | Desktop | Wide |

## Inventory (6 creatives)

### Top (3)

| Filename | Size | Aspect | Alpha | Placement |
|----------|------|--------|-------|-----------|
| `top/run-lab-banner-mobile-portrait-430.png` | 1254×1254 | 1:1 | Yes | Top — compact / mobile portrait |
| `top/run-lab-banner-mobile-landscape-844.png` | 2172×724 | ~3:1 | No | Top — mobile landscape |
| `top/run-lab-banner-desktop-1920.png` | 1920×269 | ~7.14:1 | Yes | Top — tablet + desktop |

### Side (1)

| Filename | Size | Aspect | Alpha | Placement |
|----------|------|--------|-------|-----------|
| `side/run-lab-side-banner-desktop-portrait.png` | 1024×1536 | ~0.67:1 | No | Side skyscraper — `lg+` only |

### Bottom (2)

| Filename | Size | Aspect | Alpha | Placement |
|----------|------|--------|-------|-----------|
| `bottom/run-lab-bottom-compact.png` | 1374×1145 | ~1.2:1 | No | Lower — mobile portrait / narrow |
| `bottom/run-lab-bottom-wide.png` | 2172×724 | ~3:1 | No | Lower — landscape + tablet + desktop |

### Logo

| Filename | Size | Aspect | Alpha | Placement |
|----------|------|--------|-------|-----------|
| `run-lab-official-hires-logo.png` | 1024×512 | 2:1 | Yes | Social-card attribution / optional mark |

## Placement notes

- Prefer `<picture>` media queries so phones do not flash the wide creative on first paint.
- Keep container `overflow-hidden` + radius so square black corners outside baked white borders are clipped.
- Side banner is desktop-only (`hidden lg:block`); no mobile side creative in this pack.
- Race My Rival remains the primary identity; Run-Lab is the partner/advertiser only.

## Swap a banner (no admin)

Images live under `public/partners/run-lab/`. Paths are fixed in `src/partners/campaigns.ts`. To change a creative without touching app code: **replace the file (same name) → commit on GitHub → wait for the Vercel deploy.** Prefer RGBA if you need transparent corners. Hard-refresh the phone if the old image is cached.

| Slot | File to replace |
|------|-----------------|
| Top portrait | `public/partners/run-lab/top/run-lab-banner-mobile-portrait-430.png` |
| Top landscape | `public/partners/run-lab/top/run-lab-banner-mobile-landscape-844.png` |
| Top desktop/tablet | `public/partners/run-lab/top/run-lab-banner-desktop-1920.png` |
| Side desktop | `public/partners/run-lab/side/run-lab-side-banner-desktop-portrait.png` |
| Bottom compact | `public/partners/run-lab/bottom/run-lab-bottom-compact.png` |
| Bottom wide | `public/partners/run-lab/bottom/run-lab-bottom-wide.png` |

Do not rename these files unless you also update `campaigns.ts`. Only people with GitHub write access can change creatives — there is no public upload endpoint.

## Change partner links (no admin)

All Run-Lab placements share one destination constant in `src/partners/campaigns.ts`:

```ts
const RUN_LAB_DESTINATION = "https://running-coach.uk/";
```

**Same partner domain:** edit that string (path/query is fine, e.g. `https://running-coach.uk/coaching`), commit, wait for Vercel. Top / side / lower that use the constant all update together.

**Per-slot links:** set each placement’s `destinationUrl` separately instead of sharing the constant — still a GitHub text edit.

**Different domain:** also add the new hostname to `ALLOWED_HOSTS` in `src/partners/safeUrl.ts`. Without that allowlist update, the app refuses the link (open-redirect protection) and the banner will not navigate.

Clicks also receive UTM tags via `src/partners/utm.ts` (`utm_source=racemyrival`, `utm_medium=banner`, campaign tracking code, placement as `utm_content`).
