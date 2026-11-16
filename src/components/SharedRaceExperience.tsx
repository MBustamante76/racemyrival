"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { raceDistanceById } from "@/domain/race";
import { trackSharedRaceOpened } from "./analytics";
import { RaceWorkspace } from "./RaceWorkspace";
import type { RaceFormDraft } from "./raceSession";
import { BrandHeader, PartnerShell } from "./PartnerShell";

export function SharedRaceExperience({
  raceId,
  draft,
  nameA,
  nameB,
  distanceId,
  distanceM,
}: {
  raceId: string;
  draft: RaceFormDraft;
  nameA: string;
  nameB: string;
  distanceId: string;
  distanceM: number;
}) {
  const [watching, setWatching] = useState(false);
  const distanceLabel = raceDistanceById(distanceId)?.label ?? `${distanceM}m`;

  useEffect(() => {
    trackSharedRaceOpened({ raceId, distanceId, distanceM });
  }, [raceId, distanceId, distanceM]);

  return (
    <PartnerShell header={<BrandHeader />}>
      {!watching ? (
        <section
          className="mx-auto w-full max-w-xl rounded-[var(--rmr-radius-card)] border border-border bg-card px-4 py-8 text-center shadow-card"
          data-testid="shared-race-landing"
        >
          <p
            className="font-sans text-2xl font-extrabold uppercase tracking-[-0.02em] text-brand-navy sm:text-3xl"
            data-testid="shared-race-names"
          >
            <span className="text-athlete-a">{nameA}</span>
            {" "}
            <span className="text-sm tracking-[0.16em] text-near-black">vs</span>
            {" "}
            <span className="text-athlete-b">{nameB}</span>
          </p>
          <p
            className="mt-3 font-sans text-lg font-extrabold uppercase tracking-[-0.02em] text-brand-navy"
            data-testid="shared-race-distance"
          >
            {distanceLabel}
          </p>
          <p className="mt-2 font-sans text-sm text-muted">Watch the race to see who won.</p>
          <button
            type="button"
            className="ui-transition mt-6 inline-flex min-h-11 min-w-[12rem] items-center justify-center gap-2 rounded-full bg-brand-red px-6 py-2 font-sans text-sm font-extrabold uppercase tracking-[0.12em] text-white hover:bg-brand-red-hover"
            aria-label="Watch race"
            data-testid="watch-race-button"
            onClick={() => setWatching(true)}
          >
            Watch Race
            <span aria-hidden="true">▶</span>
          </button>
        </section>
      ) : (
        <div data-testid="shared-race-player">
          <SharedRacePlayer raceId={raceId} draft={draft} />
        </div>
      )}
    </PartnerShell>
  );
}

function SharedRacePlayer({
  raceId,
  draft,
}: {
  raceId: string;
  draft: RaceFormDraft;
}) {
  return <RaceWorkspace shared={{ raceId, draft, autoStart: true }} />;
}

export function SharedRaceUnavailable() {
  return (
    <PartnerShell header={<BrandHeader />}>
      <section
        className="mx-auto w-full max-w-xl rounded-[var(--rmr-radius-card)] border border-border bg-card px-4 py-8 text-center shadow-card"
        data-testid="shared-race-unavailable"
      >
        <h2 className="font-sans text-xl font-extrabold text-brand-navy">
          This race is no longer available.
        </h2>
        <p className="mt-2 text-sm text-muted">
          The link may be invalid, expired, or removed.
        </p>
        <Link
          href="/"
          className="ui-transition mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-red px-6 py-2 font-sans text-sm font-extrabold uppercase tracking-[0.12em] text-white hover:bg-brand-red-hover"
          data-testid="create-new-race-link"
        >
          Create a New Race
        </Link>
      </section>
    </PartnerShell>
  );
}
