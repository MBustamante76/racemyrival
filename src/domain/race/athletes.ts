import { PHASE1_ATHLETE_COUNT } from "./constants";

export type AthleteCountError = "expected_two_athletes";

export type TwoAthletes<T> = [T, T];

export type RequireTwoAthletesResult<T> =
  | { ok: true; athletes: TwoAthletes<T> }
  | { ok: false; error: AthleteCountError };

export function requireTwoAthletes<T>(athletes: readonly T[]): RequireTwoAthletesResult<T> {
  if (athletes.length !== PHASE1_ATHLETE_COUNT) {
    return { ok: false, error: "expected_two_athletes" };
  }

  return { ok: true, athletes: [athletes[0], athletes[1]] };
}

export function assertTwoAthletes<T>(athletes: readonly T[]): TwoAthletes<T> {
  const result = requireTwoAthletes(athletes);
  if (!result.ok) {
    throw new Error(`Phase 1 requires exactly ${PHASE1_ATHLETE_COUNT} athletes`);
  }

  return result.athletes;
}
