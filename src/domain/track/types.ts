import type { TrackSample } from "../race/types";

export interface TrackGeometry {
  readonly lapLengthM: number;
  sampleAtDistanceAroundLap(distanceM: number): TrackSample;
  sampleForRace(raceDistanceM: number, distanceCoveredM: number): TrackSample;
}
