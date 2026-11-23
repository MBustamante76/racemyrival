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
