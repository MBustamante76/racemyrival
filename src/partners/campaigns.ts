import type { PartnerCampaign } from "./types";

/**
 * Active campaign id. Set to null / "none" for no-campaign mode.
 * Switch to "test-partner" to prove central config updates all placements.
 */
export const ACTIVE_CAMPAIGN_ID: string | null = "run-lab";

const RUN_LAB_DESTINATION = "https://running-coach.uk/";

export const RUN_LAB_CAMPAIGN: PartnerCampaign = {
  id: "run-lab",
  active: true,
  internalName: "Run-Lab house campaign",
  partnerName: "Run-Lab",
  logo: "/partners/run-lab/run-lab-official-hires-logo.png",
  attribution: "Powered by Run-Lab",
  trackingCode: "run-lab-v2",
  placements: {
    top: {
      destinationUrl: RUN_LAB_DESTINATION,
      altText: "Run-Lab — Helping people run better",
      accessibleLabel: "Visit Run-Lab coaching partner website",
      assetsByMaxWidth: [
        { maxWidth: 599, src: "/partners/run-lab/top/run-lab-banner-mobile-portrait-430.png" },
        { maxWidth: 899, src: "/partners/run-lab/top/run-lab-banner-mobile-landscape-844.png" },
        { maxWidth: 1199, src: "/partners/run-lab/top/run-lab-banner-tablet-portrait-1024.png" },
        { maxWidth: 1599, src: "/partners/run-lab/top/run-lab-banner-tablet-landscape-1366.png" },
        { maxWidth: Number.POSITIVE_INFINITY, src: "/partners/run-lab/top/run-lab-banner-desktop-1920.png" },
      ],
    },
    side: {
      destinationUrl: RUN_LAB_DESTINATION,
      altText: "Run-Lab — better movement, better performance",
      accessibleLabel: "Discover Run-Lab",
      desktopAsset: "/partners/run-lab/side/run-lab-side-banner-desktop-portrait.png",
      mobileAsset: "/partners/run-lab/side/run-lab-side-banner-iphone-portrait.png",
      assetsByMaxWidth: [
        { maxWidth: 767, src: "/partners/run-lab/side/run-lab-side-banner-iphone-portrait.png" },
        { maxWidth: Number.POSITIVE_INFINITY, src: "/partners/run-lab/side/run-lab-side-banner-desktop-portrait.png" },
      ],
    },
    lower: {
      destinationUrl: RUN_LAB_DESTINATION,
      altText: "Run-Lab — Running is a skill. Visit running-coach.uk",
      accessibleLabel: "Visit running-coach.uk",
      assetsByMaxWidth: [
        { maxWidth: 599, src: "/partners/run-lab/bottom/run-lab-bottom-mobile-portrait-430x360.webp" },
        { maxWidth: 899, src: "/partners/run-lab/bottom/run-lab-bottom-mobile-landscape-844x260.webp" },
        { maxWidth: 1199, src: "/partners/run-lab/bottom/run-lab-bottom-tablet-portrait-1024x300.webp" },
        { maxWidth: 1599, src: "/partners/run-lab/bottom/run-lab-bottom-tablet-landscape-1366x280.webp" },
        { maxWidth: Number.POSITIVE_INFINITY, src: "/partners/run-lab/bottom/run-lab-bottom-desktop-1920x320.webp" },
      ],
    },
    socialCard: {
      attribution: "Powered by Run-Lab",
      logoSrc: "/partners/run-lab/run-lab-official-hires-logo.png",
    },
  },
};

/** Generic test campaign — no third-party brand assets. */
export const TEST_PARTNER_CAMPAIGN: PartnerCampaign = {
  id: "test-partner",
  active: true,
  internalName: "Test partner",
  partnerName: "TEST PARTNER",
  attribution: "Official test partner",
  trackingCode: "test-partner",
  placements: {
    top: {
      destinationUrl: "https://example.com/",
      altText: "TEST PARTNER top banner",
      accessibleLabel: "Visit TEST PARTNER",
      desktopAsset: "/partners/test/top.svg",
      mobileAsset: "/partners/test/top.svg",
    },
    side: {
      destinationUrl: "https://example.com/",
      altText: "TEST PARTNER side banner",
      accessibleLabel: "Visit TEST PARTNER side",
      desktopAsset: "/partners/test/side.svg",
      mobileAsset: "/partners/test/side.svg",
    },
    lower: {
      destinationUrl: "https://example.com/",
      altText: "TEST PARTNER lower banner",
      accessibleLabel: "Visit TEST PARTNER lower",
      desktopAsset: "/partners/test/lower.svg",
      mobileAsset: "/partners/test/lower.svg",
    },
    socialCard: {
      attribution: "Powered by TEST PARTNER",
    },
  },
};

const CAMPAIGNS: Record<string, PartnerCampaign> = {
  [RUN_LAB_CAMPAIGN.id]: RUN_LAB_CAMPAIGN,
  [TEST_PARTNER_CAMPAIGN.id]: TEST_PARTNER_CAMPAIGN,
};

export function getCampaignById(id: string | null | undefined): PartnerCampaign | null {
  if (!id) {
    return null;
  }
  return CAMPAIGNS[id] ?? null;
}

export function getActiveCampaign(): PartnerCampaign | null {
  if (!ACTIVE_CAMPAIGN_ID) {
    return null;
  }
  const campaign = getCampaignById(ACTIVE_CAMPAIGN_ID);
  if (!campaign || !campaign.active) {
    return null;
  }
  const now = Date.now();
  if (campaign.startsAt && Date.parse(campaign.startsAt) > now) {
    return null;
  }
  if (campaign.endsAt && Date.parse(campaign.endsAt) < now) {
    return null;
  }
  return campaign;
}

type PlacementAssets = {
  desktopAsset?: string;
  mobileAsset?: string;
  assetsByMaxWidth?: Array<{ maxWidth: number; src: string }>;
};

/**
 * Pick a creative for the given **viewport** width (window.innerWidth).
 * Do not pass the partner slot's layout container width — the shell caps at ~1250px,
 * which would incorrectly select tablet bands on typical desktop monitors.
 */
export function pickPlacementAsset(
  placement: PlacementAssets | undefined,
  viewportWidthPx: number,
): string | null {
  if (!placement) {
    return null;
  }
  if (placement.assetsByMaxWidth?.length) {
    const sorted = [...placement.assetsByMaxWidth].sort((a, b) => a.maxWidth - b.maxWidth);
    for (const entry of sorted) {
      if (viewportWidthPx <= entry.maxWidth) {
        return entry.src;
      }
    }
    return sorted[sorted.length - 1]?.src ?? null;
  }
  if (viewportWidthPx < 768) {
    return placement.mobileAsset ?? placement.desktopAsset ?? null;
  }
  return placement.desktopAsset ?? placement.mobileAsset ?? null;
}

/**
 * Browser-native picture sources so the correct creative paints on first load
 * (JS width defaults to desktop during SSR and was flashing the wrong banner on phones).
 */
export function placementPictureSources(
  placement: PlacementAssets | undefined,
): { sources: Array<{ maxWidth: number; src: string }>; fallbackSrc: string } | null {
  if (!placement) {
    return null;
  }
  if (placement.assetsByMaxWidth?.length) {
    const sorted = [...placement.assetsByMaxWidth].sort((a, b) => a.maxWidth - b.maxWidth);
    const sources = sorted.filter((entry) => Number.isFinite(entry.maxWidth));
    const fallback =
      sorted.find((entry) => !Number.isFinite(entry.maxWidth))?.src ??
      sorted[sorted.length - 1]?.src;
    if (!fallback) {
      return null;
    }
    return { sources, fallbackSrc: fallback };
  }
  if (placement.mobileAsset && placement.desktopAsset) {
    return {
      sources: [{ maxWidth: 767, src: placement.mobileAsset }],
      fallbackSrc: placement.desktopAsset,
    };
  }
  const only = placement.desktopAsset ?? placement.mobileAsset;
  return only ? { sources: [], fallbackSrc: only } : null;
}
