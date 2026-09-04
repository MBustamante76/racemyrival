import { assertTwoAthletes } from "./athletes";
import { CANONICAL_LAP_M } from "./constants";
import type { AthleteId, AthleteInput, AthleteRaceState, PaceModel } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function averageSpeedMps(distanceM: number, finishTimeMs: number): number {
  return distanceM / (finishTimeMs / 1000);
}

export function raceProgress(distanceCoveredM: number, raceDistanceM: number): number {
  if (raceDistanceM <= 0) {
    return 0;
  }

  return clamp(distanceCoveredM / raceDistanceM, 0, 1);
}

export function completedLaps(
  distanceCoveredM: number,
  lapM: number = CANONICAL_LAP_M,
): number {
  return Math.floor(distanceCoveredM / lapM);
}

export function currentLapProgress(
  distanceCoveredM: number,
  lapM: number = CANONICAL_LAP_M,
): number {
  return (distanceCoveredM % lapM) / lapM;
}

export function totalLaps(
  distanceCoveredM: number,
  lapM: number = CANONICAL_LAP_M,
): number {
  return distanceCoveredM / lapM;
}

export function timeGapMs(finishTimesMs: readonly number[]): number {
  const [firstMs, secondMs] = assertTwoAthletes(finishTimesMs);
  return Math.abs(firstMs - secondMs);
}

export function currentLeadM(distancesM: readonly number[]): number {
  if (distancesM.length === 0) {
    return 0;
  }

  return Math.max(...distancesM) - Math.min(...distancesM);
}

export function relativeSpeed(speedAMps: number, speedBMps: number): number {
  if (speedBMps === 0) {
    return 0;
  }

  return speedAMps / speedBMps;
}

export function pacePer100mMs(finishTimeMs: number, distanceM: number): number {
  return finishTimeMs * (100 / distanceM);
}

export function pacePer400mMs(finishTimeMs: number, distanceM: number): number {
  return finishTimeMs * (400 / distanceM);
}

export function winnerIdFromFinishTimes(
  athletes: ReadonlyArray<{ id: AthleteId; finishTimeMs: number }>,
): AthleteId | null {
  const [first, second] = assertTwoAthletes(athletes);
  if (first.finishTimeMs === second.finishTimeMs) {
    return null;
  }

  return first.finishTimeMs < second.finishTimeMs ? first.id : second.id;
}

export function isTie(
  athletes: ReadonlyArray<{ finishTimeMs: number }>,
): boolean {
  const [first, second] = assertTwoAthletes(athletes);
  return first.finishTimeMs === second.finishTimeMs;
}

export function deriveAthleteState(
  athlete: AthleteInput,
  pace: PaceModel,
  elapsedMs: number,
): AthleteRaceState {
  const distanceCoveredM = pace.distanceAt(elapsedMs);
  const speedMps = pace.speedAt?.(elapsedMs) ?? averageSpeedMps(pace.totalDistanceM, pace.finishTimeMs);

  return {
    id: athlete.id,
    name: athlete.name,
    finishTimeMs: athlete.finishTimeMs,
    distanceCoveredM,
    progress: raceProgress(distanceCoveredM, pace.totalDistanceM),
    completedLaps: completedLaps(distanceCoveredM),
    currentLapProgress: currentLapProgress(distanceCoveredM),
    speedMps,
    pacePer100mMs: pacePer100mMs(pace.finishTimeMs, pace.totalDistanceM),
    pacePer400mMs: pacePer400mMs(pace.finishTimeMs, pace.totalDistanceM),
    finished: distanceCoveredM >= pace.totalDistanceM,
  };
}
