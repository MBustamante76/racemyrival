import type { TrackSample, Vec2 } from "../race/types";
import {
  CANONICAL_LAP_M,
  STADIUM_BEND_M,
  STADIUM_BEND_RADIUS_M,
  STADIUM_STRAIGHT_M,
} from "./constants";
import { distanceAroundTrackM } from "./startOffset";
import type { TrackGeometry } from "./types";
import { inwardNormal, normalize, vec2, wrapLapDistance } from "./vec2";

const FIRST_BEND_END_M = STADIUM_BEND_M;
const BACK_STRAIGHT_END_M = FIRST_BEND_END_M + STADIUM_STRAIGHT_M;
const SECOND_BEND_END_M = BACK_STRAIGHT_END_M + STADIUM_BEND_M;

export class StadiumTrackGeometry implements TrackGeometry {
  readonly lapLengthM = CANONICAL_LAP_M;

  sampleAtDistanceAroundLap(distanceM: number): TrackSample {
    const aroundM = wrapLapDistance(distanceM, this.lapLengthM);
    return this.sampleUnwrapped(aroundM);
  }

  sampleForRace(raceDistanceM: number, distanceCoveredM: number): TrackSample {
    const aroundM = distanceAroundTrackM(raceDistanceM, distanceCoveredM, this.lapLengthM);
    return this.sampleUnwrapped(aroundM);
  }

  private sampleUnwrapped(aroundM: number): TrackSample {
    const { position, tangent } = this.poseAt(aroundM);
    const unitTangent = normalize(tangent);

    return {
      position,
      tangent: unitTangent,
      normal: inwardNormal(unitTangent),
      distanceAroundLapM: aroundM,
      lapProgress: aroundM / this.lapLengthM,
    };
  }

  private poseAt(aroundM: number): { position: Vec2; tangent: Vec2 } {
    const radius = STADIUM_BEND_RADIUS_M;
    const halfStraight = STADIUM_STRAIGHT_M / 2;

    if (aroundM <= FIRST_BEND_END_M) {
      const angle = -Math.PI / 2 + aroundM / radius;
      return {
        position: vec2(halfStraight + radius * Math.cos(angle), radius * Math.sin(angle)),
        tangent: vec2(-Math.sin(angle), Math.cos(angle)),
      };
    }

    if (aroundM <= BACK_STRAIGHT_END_M) {
      const alongM = aroundM - FIRST_BEND_END_M;
      return {
        position: vec2(halfStraight - alongM, radius),
        tangent: vec2(-1, 0),
      };
    }

    if (aroundM <= SECOND_BEND_END_M) {
      const alongM = aroundM - BACK_STRAIGHT_END_M;
      const angle = Math.PI / 2 + alongM / radius;
      return {
        position: vec2(-halfStraight + radius * Math.cos(angle), radius * Math.sin(angle)),
        tangent: vec2(-Math.sin(angle), Math.cos(angle)),
      };
    }

    const alongM = aroundM - SECOND_BEND_END_M;
    return {
      position: vec2(-halfStraight + alongM, -radius),
      tangent: vec2(1, 0),
    };
  }
}

export const stadiumTrack = new StadiumTrackGeometry();
