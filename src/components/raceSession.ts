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

export const DEFAULT_ATHLETE_NAMES = {
  A: "Your Name",
  B: "Your Rival",
} as const;

/** Sensible default finishing times (ms) per distance: [you, rival]. */
export const DEFAULT_TIMES_BY_DISTANCE_MS: Record<string, readonly [number, number]> = {
  "100": [14_000, 10_000],
  "200": [28_000, 20_000],
  "400": [62_000, 45_000],
  "600": [100_000, 80_000],
  "800": [140_000, 105_000],
  "1000": [185_000, 150_000],
  "1500": [285_000, 210_000],
  mile: [310_000, 239_000],
  "3000": [630_000, 510_000],
  "5000": [1_170_000, 960_000],
};

export interface TimeParts {
  minutes: string;
  seconds: string;
  hundredths: string;
}

export interface AthleteDraft {
  id: string;
  name: string;
  time: TimeParts;
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

export function defaultTimesForDistance(distanceId: string): [TimeParts, TimeParts] {
  const pair = DEFAULT_TIMES_BY_DISTANCE_MS[distanceId] ?? DEFAULT_TIMES_BY_DISTANCE_MS[DEFAULT_DISTANCE_ID];
  return [timePartsFromMilliseconds(pair[0]), timePartsFromMilliseconds(pair[1])];
}

export function createDefaultAthleteDrafts(distanceId = DEFAULT_DISTANCE_ID): [AthleteDraft, AthleteDraft] {
  const [timeA, timeB] = defaultTimesForDistance(distanceId);
  return [
    { id: "A", name: DEFAULT_ATHLETE_NAMES.A, time: timeA },
    { id: "B", name: DEFAULT_ATHLETE_NAMES.B, time: timeB },
  ];
}

export const DEFAULT_ATHLETE_DRAFTS: [AthleteDraft, AthleteDraft] =
  createDefaultAthleteDrafts(DEFAULT_DISTANCE_ID);

export function nameFieldError(name: string): string | null {
  return name.trim() === "" ? "Enter a name" : null;
}

export function timePartsFromMilliseconds(milliseconds: number): TimeParts {
  const totalHundredths = Math.max(0, Math.round(milliseconds / 10));
  const minutes = Math.floor(totalHundredths / 6_000);
  const remainder = totalHundredths % 6_000;
  const seconds = Math.floor(remainder / 100);
  const hundredths = remainder % 100;

  return {
    minutes: String(minutes),
    seconds: seconds.toString().padStart(2, "0"),
    hundredths: hundredths.toString().padStart(2, "0"),
  };
}

export function composeTimeText(time: TimeParts): string {
  const minutes = sanitizeMinutes(time.minutes) || "0";
  const seconds = (sanitizeSeconds(time.seconds) || "0").padStart(2, "0");
  const hundredths = (sanitizeHundredths(time.hundredths) || "0").padStart(2, "0");
  return `${minutes}:${seconds}.${hundredths}`;
}

export function sanitizeMinutes(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2);
}

export function sanitizeSeconds(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (digits === "") {
    return "";
  }

  return Number(digits) > 59 ? digits.slice(0, 1) : digits;
}

export function sanitizeHundredths(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2);
}

export function timeFieldError(time: TimeParts): string | null {
  const parsed = parseRaceTime(composeTimeText(time));
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

    const parsedTime = parseRaceTime(composeTimeText(athlete.time));
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
