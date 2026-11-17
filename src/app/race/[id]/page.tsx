import type { Metadata } from "next";
import { raceDistanceById } from "@/domain/race";
import {
  SharedRaceExperience,
  SharedRaceUnavailable,
} from "@/components/SharedRaceExperience";
import {
  getSharedRace,
  isOpaqueRaceId,
  sharedRaceToFormDraft,
} from "@/server/sharedRace";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const NEUTRAL_MISSING_METADATA: Metadata = {
  title: "Race My Rival",
  description: "Turn times into races.",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isOpaqueRaceId(id)) {
    return NEUTRAL_MISSING_METADATA;
  }

  const race = await getSharedRace(id);
  if (!race) {
    // Avoid "Race unavailable" in WhatsApp/OG titles when Redis lookup fails transiently.
    return NEUTRAL_MISSING_METADATA;
  }

  const distanceLabel = raceDistanceById(race.distanceId)?.label ?? `${race.distanceM}m`;
  const title = `${race.competitorA.displayName} vs ${race.competitorB.displayName}`;
  const description = `${distanceLabel} — Who won?`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharedRacePage({ params }: PageProps) {
  const { id } = await params;

  if (!isOpaqueRaceId(id)) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-page">
        <SharedRaceUnavailable />
      </div>
    );
  }

  const race = await getSharedRace(id);
  if (!race) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-page">
        <SharedRaceUnavailable />
      </div>
    );
  }

  const draft = sharedRaceToFormDraft(race);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <SharedRaceExperience
        raceId={race.id}
        draft={draft}
        nameA={race.competitorA.displayName}
        nameB={race.competitorB.displayName}
        distanceId={race.distanceId}
        distanceM={race.distanceM}
      />
    </div>
  );
}
