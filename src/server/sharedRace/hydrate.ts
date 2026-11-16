import {
  timePartsFromMilliseconds,
  type AthleteDraft,
  type RaceFormDraft,
} from "@/components/raceSession";
import type { SharedRace } from "./types";

/** Map a stored shared race into the existing race form draft shape. */
export function sharedRaceToFormDraft(race: SharedRace): RaceFormDraft {
  const athletes: [AthleteDraft, AthleteDraft] = [
    {
      id: "A",
      name: race.competitorA.displayName,
      time: timePartsFromMilliseconds(race.competitorA.finishTimeMs),
    },
    {
      id: "B",
      name: race.competitorB.displayName,
      time: timePartsFromMilliseconds(race.competitorB.finishTimeMs),
    },
  ];
  return {
    distanceId: race.distanceId,
    athletes,
  };
}
