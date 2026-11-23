"use client";

import type { ReactNode } from "react";
import { useLandscapeBand } from "@/components/landscapeFit";
import { getActiveCampaign } from "@/partners/campaigns";
import { PartnerBanner } from "@/partners/PartnerPlacement";

export function PartnerShell({
  header,
  children,
}: {
  header?: ReactNode;
  children: ReactNode;
}) {
  const campaign = getActiveCampaign();
  const top = campaign?.placements.top;
  const side = campaign?.placements.side;
  const lower = campaign?.placements.lower;

  return (
    <div
      data-rmr-partner-shell
      className="mx-auto flex w-full min-w-0 max-w-[1250px] flex-col gap-2 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3 md:gap-3 md:px-6 md:py-3 lg:px-8"
    >
      {header ? <div data-rmr-landscape-race-hide>{header}</div> : null}

      {campaign && top ? (
        <div data-rmr-landscape-race-hide>
          <PartnerBanner
            campaign={campaign}
            slot="top"
            placement={top}
            /* 12px clears ~15px baked black corners at the ~1250px content width */
            className="w-full rounded-xl"
          />
        </div>
      ) : null}

      <div
        className={
          campaign && side
            ? "flex w-full min-w-0 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] lg:items-start"
            : "w-full min-w-0"
        }
      >
        <div className="flex min-w-0 flex-col gap-2 sm:gap-3">{children}</div>
        {campaign && side ? (
          <div data-rmr-landscape-race-hide>
            <PartnerBanner
              campaign={campaign}
              slot="side"
              placement={side}
              className="hidden rounded-xl lg:block"
            />
          </div>
        ) : null}
      </div>

      {campaign && lower ? (
        <div data-rmr-landscape-race-hide>
          <PartnerBanner
            campaign={campaign}
            slot="lower"
            placement={lower}
            className="w-full rounded-xl"
          />
        </div>
      ) : null}
    </div>
  );
}

export function BrandHeader() {
  const landscapeBand = useLandscapeBand();
  const compactLandscape = landscapeBand !== "none";

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="sr-only">Race My Rival</h1>
      <a
        href="/"
        data-testid="brand-logo-link"
        aria-label="Race My Rival — create a new race"
        className="inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={(event) => {
          // Same destination as Create New Race; force a full load so mid-race
          // client state clears even when already on home.
          event.preventDefault();
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- logo home reset outside App Router tests
          window.location.assign("/");
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG from public/brand */}
        <img
          src="/brand/race-my-rival-with-tagline-colour.svg"
          alt=""
          className={
            compactLandscape
              ? "h-auto w-full max-w-[14rem]"
              : "h-auto w-full max-w-[18rem] sm:max-w-[22rem] lg:max-w-[26rem]"
          }
          data-testid="brand-logo"
        />
      </a>
    </div>
  );
}
