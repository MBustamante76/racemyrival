"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackPartnerClick,
  trackPartnerImpression,
} from "@/components/analytics";
import { pickPlacementAsset } from "./campaigns";
import { isSafePartnerDestination } from "./safeUrl";
import type { PartnerCampaign, PartnerPlacement as PlacementConfig } from "./types";
import { withPartnerUtm } from "./utm";

export type PartnerSlot = "top" | "side" | "lower";

/** Supplier bands are viewport-based, not the capped advert container (~1250px). */
function useViewportWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    function update(): void {
      setWidth(window.innerWidth);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}

export function PartnerBanner({
  campaign,
  slot,
  placement,
  className,
}: {
  campaign: PartnerCampaign;
  slot: PartnerSlot;
  placement: PlacementConfig;
  className?: string;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const width = useViewportWidth();
  const impressedRef = useRef(false);
  const src = pickPlacementAsset(placement, width);
  const href =
    placement.destinationUrl && isSafePartnerDestination(placement.destinationUrl)
      ? withPartnerUtm({
          destinationUrl: placement.destinationUrl,
          campaignId: campaign.id,
          trackingCode: campaign.trackingCode,
          placement: slot,
        })
      : undefined;

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !src || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || impressedRef.current) {
          return;
        }
        impressedRef.current = true;
        trackPartnerImpression({
          campaignId: campaign.id,
          placement: slot,
          viewport: width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop",
        });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [campaign.id, slot, src, width]);

  if (!src) {
    return null;
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- partner creatives are static public assets with known dimensions
    <img
      src={src}
      alt={placement.altText ?? ""}
      className="h-auto w-full"
      loading={slot === "top" ? "eager" : "lazy"}
      decoding="async"
    />
  );

  return (
    <aside
      ref={containerRef}
      data-testid={`partner-placement-${slot}`}
      data-campaign-id={campaign.id}
      className={className}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={placement.accessibleLabel ?? `Visit ${campaign.partnerName}`}
          onClick={() =>
            trackPartnerClick({
              campaignId: campaign.id,
              placement: slot,
              destination: href,
            })
          }
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </aside>
  );
}
