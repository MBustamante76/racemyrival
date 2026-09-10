import type { TrackSample } from "../race/types";
import { stadiumTrack } from "./StadiumTrackGeometry";
import type { TrackGeometry } from "./types";
import { add, scale } from "./vec2";

export const SPRINT_STRAIGHT_M = 100;

export class SprintStraightGeometry implements TrackGeometry {
  readonly lapLengthM = SPRINT_STRAIGHT_M;

  sampleAtDistanceAroundLap(distanceM: number): TrackSample {
    const alongM = Math.min(Math.max(distanceM, 0), this.lapLengthM);
    return this.sampleAlong(alongM);
  }

  sampleForRace(raceDistanceM: number, distanceCoveredM: number): TrackSample {
    const alongM = Math.min(Math.max(distanceCoveredM, 0), raceDistanceM);
    return this.sampleAlong(alongM);
  }

  private sampleAlong(alongM: number): TrackSample {
    const finish = stadiumTrack.sampleAtDistanceAroundLap(0);
    const start = add(finish.position, scale(finish.tangent, -this.lapLengthM));
    const position = add(start, scale(finish.tangent, alongM));

    return {
      position,
      tangent: finish.tangent,
      normal: finish.normal,
      distanceAroundLapM: 0,
      lapProgress: alongM / this.lapLengthM,
    };
  }
}

export const sprintStraight = new SprintStraightGeometry();
