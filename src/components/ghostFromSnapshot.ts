import type { TrackAthleteView } from "./trackView";

export function ghostAthletesFromSnapshot(
  athletes: readonly TrackAthleteView[],
  snapshot: {
    winnerId: string | null;
    athletes: ReadonlyArray<{ id: string; distanceM: number }>;
  } | null,
): TrackAthleteView[] {
  if (!snapshot?.winnerId) {
    return [];
  }

  return athletes.flatMap((athlete) => {
    if (athlete.id === snapshot.winnerId) {
      return [];
    }

    const sample = snapshot.athletes.find((entry) => entry.id === athlete.id);
    if (!sample) {
      return [];
    }

    return [
      {
        id: athlete.id,
        name: athlete.name,
        distanceCoveredM: sample.distanceM,
      },
    ];
  });
}
