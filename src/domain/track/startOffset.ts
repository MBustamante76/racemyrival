import { CANONICAL_LAP_M } from "./constants";

export function startOffsetM(
  raceDistanceM: number,
  lapLengthM: number = CANONICAL_LAP_M,
): number {
  return (lapLengthM - (raceDistanceM % lapLengthM)) % lapLengthM;
}

export function distanceAroundTrackM(
  raceDistanceM: number,
  distanceCoveredM: number,
  lapLengthM: number = CANONICAL_LAP_M,
): number {
  if (distanceCoveredM >= raceDistanceM) {
    return 0;
  }

  return (startOffsetM(raceDistanceM, lapLengthM) + distanceCoveredM) % lapLengthM;
}
