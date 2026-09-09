import type { TrackSample } from "../race/types";
import { clamp } from "../race/calculations";
import {
  SPRINT_STRAIGHT_M,
  STADIUM_BEND_RADIUS_M,
  STADIUM_STRAIGHT_M,
} from "./constants";
import { stadiumTrack } from "./StadiumTrackGeometry";
import type { TrackGeometry } from "./types";
import { inwardNormal, vec2 } from "./vec2";

const TANGENT = vec2(1, 0);
const NORMAL = inwardNormal(TANGENT);

export class SprintStraightGeometry implements TrackGeometry {
  readonly lapLengthM = SPRINT_STRAIGHT_M;

  sampleAtDistanceAroundLap(distanceM: number): TrackSample {
    return this.sampleAtDistance(distanceM);
  }

  sampleForRace(_raceDistanceM: number, distanceCoveredM: number): TrackSample {
    return this.sampleAtDistance(distanceCoveredM);
  }

  sampleAtDistance(distanceCoveredM: number): TrackSample {
    const alongM = clamp(distanceCoveredM, 0, this.lapLengthM);
    const finish = stadiumTrack.sampleAtDistanceAroundLap(0);
    const remainingM = this.lapLengthM - alongM;

    return {
      position: vec2(finish.position.x - remainingM, -STADIUM_BEND_RADIUS_M),
      tangent: TANGENT,
      normal: NORMAL,
      distanceAroundLapM: alongM,
      lapProgress: alongM / this.lapLengthM,
    };
  }
}

export const sprintStraight = new SprintStraightGeometry();

export function homeStraightLeftTangentX(): number {
  return -STADIUM_STRAIGHT_M / 2;
}
