export type PartnerUtmInput = {
  destinationUrl: string;
  campaignId: string;
  trackingCode?: string;
  placement: "top" | "side" | "lower";
};

/**
 * Append standard UTM tags for partner banner clicks.
 * Existing query params are preserved; UTM keys overwrite if already present.
 */
export function withPartnerUtm(input: PartnerUtmInput): string {
  const url = new URL(input.destinationUrl);
  url.searchParams.set("utm_source", "racemyrival");
  url.searchParams.set("utm_medium", "banner");
  url.searchParams.set("utm_campaign", input.trackingCode || input.campaignId);
  url.searchParams.set("utm_content", input.placement);
  return url.toString();
}
