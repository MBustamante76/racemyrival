"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackPartnerClick,
  trackPartnerImpression,
} from "@/components/analytics";
import { pickPlacementAsset, placementPictureSources } from "./campaigns";
import { isSafePartnerDestination } from "./safeUrl";
import type { PartnerCampaign, PartnerPlacement as PlacementConfig } from "./types";
import { withPartnerUtm } from "./utm";

export type PartnerSlot = "top" | "side" | "lower";

/** Viewport width for analytics only — creative selection uses picture media queries. */
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
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
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
  const picture = placementPictureSources(placement);
  const src = picture?.fallbackSrc ?? pickPlacementAsset(placement, width);
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

  if (!picture && !src) {
    return null;
  }

  const image = (
    <picture data-testid={`partner-picture-${slot}`}>
      {(picture?.sources ?? []).map((entry) => (
        <source
          key={`${entry.maxWidth}-${entry.src}`}
          media={`(max-width: ${entry.maxWidth}px)`}
          srcSet={entry.src}
        />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element -- partner creatives are static public assets with known dimensions */}
      <img
        src={picture?.fallbackSrc ?? src ?? undefined}
        alt={placement.altText ?? ""}
        className="block h-auto w-full rounded-[inherit]"
        loading={slot === "top" ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );

  return (
    <aside
      ref={containerRef}
      data-testid={`partner-placement-${slot}`}
      data-campaign-id={campaign.id}
      className={["overflow-hidden", className].filter(Boolean).join(" ")}
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
          className="block overflow-hidden rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </aside>
  );
}
