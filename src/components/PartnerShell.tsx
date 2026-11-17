"use client";

import type { ReactNode } from "react";
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
    <div className="mx-auto flex w-full min-w-0 max-w-[1250px] flex-col gap-2 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3 md:gap-3 md:px-6 md:py-3 lg:px-8">
      {header}

      {campaign && top ? (
        <PartnerBanner
          campaign={campaign}
          slot="top"
          placement={top}
          className="w-full overflow-hidden rounded-[var(--rmr-radius-control)]"
        />
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
          <PartnerBanner
            campaign={campaign}
            slot="side"
            placement={side}
            className="overflow-hidden rounded-[var(--rmr-radius-control)]"
          />
        ) : null}
      </div>

      {campaign && lower ? (
        <PartnerBanner
          campaign={campaign}
          slot="lower"
          placement={lower}
          className="w-full overflow-hidden rounded-[var(--rmr-radius-control)]"
        />
      ) : null}
    </div>
  );
}

export function BrandHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="sr-only">Race My Rival</h1>
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG from public/brand */}
      <img
        src="/brand/race-my-rival-with-tagline-colour.svg"
        alt="Race My Rival — Turn times into races."
        className="h-auto w-full max-w-[18rem] sm:max-w-[22rem] lg:max-w-[26rem] [@media(orientation:landscape)_and_(max-height:900px)]:max-w-[14rem]"
        data-testid="brand-logo"
      />
    </div>
  );
}
