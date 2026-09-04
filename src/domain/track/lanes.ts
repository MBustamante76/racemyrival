import type { AthleteId } from "../race/types";
import type { TrackSample, Vec2 } from "../race/types";
import { assertTwoAthletes } from "../race/athletes";
import { COMPARISON_LANE_SEPARATION_M, STANDARD_LANE_WIDTH_M } from "./constants";
import { add, scale } from "./vec2";

export type LaneGeometryMode = "comparison" | "official";

export interface LaneDefinition {
  laneNumber: number;
  widthM: number;
  visualOffsetM: number;
}

export interface LaneAssignment {
  athleteId: AthleteId;
  lane: LaneDefinition;
}

export interface LaneModel {
  readonly mode: LaneGeometryMode;
  assign(athleteIds: readonly AthleteId[]): LaneAssignment[];
  visualPosition(sample: TrackSample, lane: LaneDefinition): Vec2;
}

export const COMPARISON_INNER_LANE: LaneDefinition = {
  laneNumber: 1,
  widthM: STANDARD_LANE_WIDTH_M,
  visualOffsetM: 0,
};

export const COMPARISON_ADJACENT_LANE: LaneDefinition = {
  laneNumber: 2,
  widthM: STANDARD_LANE_WIDTH_M,
  visualOffsetM: -COMPARISON_LANE_SEPARATION_M,
};

export function offsetVisualPosition(sample: TrackSample, visualOffsetM: number): Vec2 {
  return add(sample.position, scale(sample.normal, visualOffsetM));
}

export class ComparisonLaneModel implements LaneModel {
  readonly mode = "comparison" as const;

  assign(athleteIds: readonly AthleteId[]): LaneAssignment[] {
    const [firstId, secondId] = assertTwoAthletes(athleteIds);
    const lanes = [COMPARISON_INNER_LANE, COMPARISON_ADJACENT_LANE];

    return [firstId, secondId].map((athleteId, index) => ({
      athleteId,
      lane: lanes[index],
    }));
  }

  visualPosition(sample: TrackSample, lane: LaneDefinition): Vec2 {
    return offsetVisualPosition(sample, lane.visualOffsetM);
  }
}

export function createLaneModel(mode: LaneGeometryMode = "comparison"): LaneModel {
  if (mode === "official") {
    throw new Error("Official lane geometry is not implemented in this prototype");
  }

  return new ComparisonLaneModel();
}
