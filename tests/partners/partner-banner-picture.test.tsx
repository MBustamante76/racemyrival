import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PartnerBanner } from "@/partners/PartnerPlacement";
import { RUN_LAB_CAMPAIGN } from "@/partners/campaigns";

describe("PartnerBanner picture selection", () => {
  it("emits mobile-portrait as the first source before desktop fallback", () => {
    render(
      <PartnerBanner
        campaign={RUN_LAB_CAMPAIGN}
        slot="top"
        placement={RUN_LAB_CAMPAIGN.placements.top!}
      />,
    );

    const picture = screen.getByTestId("partner-picture-top");
    const sources = picture.querySelectorAll("source");
    expect(sources.length).toBeGreaterThanOrEqual(1);
    expect(sources[0]?.getAttribute("media")).toBe("(max-width: 599px)");
    expect(sources[0]?.getAttribute("srcset")).toContain("mobile-portrait");

    const img = picture.querySelector("img");
    expect(img?.getAttribute("src")).toContain("desktop-1920");
  });
});
