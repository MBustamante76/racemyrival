import {
  ConstantPaceModel,
  RaceClock,
  RaceEngine,
  RaceSimulation,
  parseRaceTime,
  raceDistanceById,
} from "@/domain/race";
import type { AthleteInput, ParseRaceTimeError } from "@/domain/race";

export const DEFAULT_DISTANCE_ID = "800";

export const DEFAULT_ATHLETE_DRAFTS: [AthleteDraft, AthleteDraft] = [
  { id: "A", name: "Marcelo", timeText: "2:04.00" },
  { id: "B", name: "Josh", timeText: "1:52.00" },
];

export interface AthleteDraft {
  id: string;
  name: string;
  timeText: string;
}

export interface RaceFormDraft {
  distanceId: string;
  athletes: [AthleteDraft, AthleteDraft];
}

export interface ParsedRaceForm {
  distanceM: number;
  athletes: AthleteInput[];
}

const TIME_ERROR_MESSAGES: Record<ParseRaceTimeError, string> = {
  blank: "Enter a finishing time",
  zero: "Time must be greater than zero",
  negative: "Time cannot be negative",
  malformed: "Use SS.ff or M:SS.ff",
  seconds_out_of_range: "Seconds must be below 60",
  non_numeric: "Use SS.ff or M:SS.ff",
};

export function nameFieldError(name: string): string | null {
  return name.trim() === "" ? "Enter a name" : null;
}

export function timeFieldError(timeText: string): string | null {
  const parsed = parseRaceTime(timeText);
  return parsed.ok ? null : TIME_ERROR_MESSAGES[parsed.error];
}

export function parseRaceForm(draft: RaceFormDraft): ParsedRaceForm | null {
  const distance = raceDistanceById(draft.distanceId);
  if (!distance) {
    return null;
  }

  const athletes: AthleteInput[] = [];
  for (const athlete of draft.athletes) {
    if (nameFieldError(athlete.name)) {
      return null;
    }

    const parsedTime = parseRaceTime(athlete.timeText);
    if (!parsedTime.ok) {
      return null;
    }

    athletes.push({
      id: athlete.id,
      name: athlete.name.trim(),
      finishTimeMs: parsedTime.milliseconds,
    });
  }

  return {
    distanceM: distance.distanceM,
    athletes,
  };
}

export function canStartRace(draft: RaceFormDraft): boolean {
  return parseRaceForm(draft) !== null;
}

export function createConfiguredRace(parsed: ParsedRaceForm): RaceSimulation {
  return new RaceSimulation(
    new RaceEngine(
      {
        distanceM: parsed.distanceM,
        athletes: parsed.athletes,
      },
      parsed.athletes.map(
        (athlete) => new ConstantPaceModel(parsed.distanceM, athlete.finishTimeMs),
      ),
    ),
    new RaceClock(),
  );
}
