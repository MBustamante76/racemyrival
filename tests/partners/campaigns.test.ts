import { describe, expect, it } from "vitest";
import {
  ACTIVE_CAMPAIGN_ID,
  getActiveCampaign,
  getCampaignById,
  pickPlacementAsset,
  RUN_LAB_CAMPAIGN,
  TEST_PARTNER_CAMPAIGN,
} from "@/partners/campaigns";
import { isSafePartnerDestination } from "@/partners/safeUrl";
import { withPartnerUtm } from "@/partners/utm";

describe("partner campaigns", () => {
  it("exposes the Run-Lab campaign as the default active id", () => {
    expect(ACTIVE_CAMPAIGN_ID).toBe("run-lab");
    expect(getActiveCampaign()?.id).toBe("run-lab");
    expect(getCampaignById("run-lab")).toEqual(RUN_LAB_CAMPAIGN);
    expect(getCampaignById("test-partner")).toEqual(TEST_PARTNER_CAMPAIGN);
  });

  it("picks responsive assets by container width", () => {
    const top = RUN_LAB_CAMPAIGN.placements.top!;
    expect(pickPlacementAsset(top, 390)).toContain("mobile-portrait");
    expect(pickPlacementAsset(top, 800)).toContain("mobile-landscape");
    expect(pickPlacementAsset(top, 1920)).toContain("desktop-1920");
  });

  it("allowlists partner destinations", () => {
    expect(isSafePartnerDestination("https://running-coach.uk/")).toBe(true);
    expect(isSafePartnerDestination("https://evil.example/phish")).toBe(false);
    expect(isSafePartnerDestination("javascript:alert(1)")).toBe(false);
  });

  it("appends placement UTM tags to partner destinations", () => {
    const tagged = withPartnerUtm({
      destinationUrl: "https://running-coach.uk/",
      campaignId: "run-lab",
      trackingCode: "run-lab-v2",
      placement: "side",
    });
    const url = new URL(tagged);
    expect(url.origin + url.pathname).toBe("https://running-coach.uk/");
    expect(url.searchParams.get("utm_source")).toBe("racemyrival");
    expect(url.searchParams.get("utm_medium")).toBe("banner");
    expect(url.searchParams.get("utm_campaign")).toBe("run-lab-v2");
    expect(url.searchParams.get("utm_content")).toBe("side");
    expect(isSafePartnerDestination(tagged)).toBe(true);
  });
});
