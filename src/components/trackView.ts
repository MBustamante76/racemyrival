import {
  CANONICAL_LAP_M,
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  SPRINT_CHUTE_EXTENSION_M,
  STADIUM_BEND_RADIUS_M,
  STADIUM_STRAIGHT_M,
  createLaneModel,
  createRaceCourse,
  sprintStraight,
  stadiumTrack,
} from "@/domain/track";
import type { CourseType, LaneDefinition } from "@/domain/track";
import type { TrackSample } from "@/domain/race";

export const SAMPLE_STEP_M = 2;
export const PADDING_M = 12;
export const FINISH_LINE_M = 10;
export const START_TICK_M = 7;
export const SPRINT_START_OVERHANG_M = 3;
export const SPRINT_START_LABEL = "START 100m";
export const MARKER_RADIUS_M = 2.2;
export const LABEL_INFIELD_M = 6.5;
export const LABEL_OUTFIELD_EXTRA_M = 6.5;
export const DISTANCE_LABEL_INFIELD_M = 5;
export const DISTANCE_TICK_M = 3;
export const DISTANCE_MARKS_M = [100, 200, 300] as const;

const lanes = createLaneModel("comparison");

export interface TrackAthleteView {
  id: string;
  name: string;
  distanceCoveredM: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface AthleteMarkerLayout {
  id: string;
  name: string;
  distanceCoveredM: number;
  laneNumber: number;
  marker: ScreenPoint;
  label: ScreenPoint;
}

export function toSvgPoint(x: number, y: number): ScreenPoint {
  return { x: svgNumber(x), y: svgNumber(-y) };
}

export function svgNumber(value: number): number {
  return Number(value.toFixed(6));
}

export function trackViewBox(): { minX: number; minY: number; width: number; height: number; value: string } {
  const halfWidth = svgNumber(STADIUM_STRAIGHT_M / 2 + STADIUM_BEND_RADIUS_M + PADDING_M);
  const halfHeight = svgNumber(STADIUM_BEND_RADIUS_M + PADDING_M);
  return {
    minX: -halfWidth,
    minY: -halfHeight,
    width: svgNumber(halfWidth * 2),
    height: svgNumber(halfHeight * 2),
    value: `${-halfWidth} ${-halfHeight} ${halfWidth * 2} ${halfHeight * 2}`,
  };
}

export function laneLinePoints(lane: LaneDefinition): string {
  return sampleLanePoints(lane).map((point) => `${point.x},${point.y}`).join(" ");
}

export function infieldPolygonPoints(): string {
  return sampleLanePoints(COMPARISON_INNER_LANE)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

export function finishLineSegment(): { x1: number; y1: number; x2: number; y2: number } {
  return crossTrackSegment(0, FINISH_LINE_M);
}

export function courseTypeForView(raceDistanceM: number): CourseType {
  return createRaceCourse(raceDistanceM).type;
}

export function startTickSegment(raceDistanceM: number): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} | null {
  if (courseTypeForView(raceDistanceM) === "sprint-straight") {
    return null;
  }

  const course = createRaceCourse(raceDistanceM);
  const start = course.sampleAtDistance(0);
  const finish = stadiumTrack.sampleAtDistanceAroundLap(0);
  if (
    start.position.x === finish.position.x &&
    start.position.y === finish.position.y
  ) {
    return null;
  }

  return crossSampleSegment(start, START_TICK_M);
}

export function sprintStartSegment(): { x1: number; y1: number; x2: number; y2: number } {
  const sample = sprintStraight.sampleAtDistance(0);
  const inner = lanes.visualPosition(sample, COMPARISON_INNER_LANE);
  const adjacent = lanes.visualPosition(sample, COMPARISON_ADJACENT_LANE);
  const start = {
    x: adjacent.x - sample.normal.x * SPRINT_START_OVERHANG_M,
    y: adjacent.y - sample.normal.y * SPRINT_START_OVERHANG_M,
  };
  const end = {
    x: inner.x + sample.normal.x * SPRINT_START_OVERHANG_M,
    y: inner.y + sample.normal.y * SPRINT_START_OVERHANG_M,
  };
  const from = toSvgPoint(start.x, start.y);
  const to = toSvgPoint(end.x, end.y);
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
}

export function sprintStartLabelPoint(): ScreenPoint {
  const sample = sprintStraight.sampleAtDistance(0);
  const alongM = 8.5;
  const outfieldM = 8.2;
  const label = {
    x: sample.position.x - sample.tangent.x * alongM - sample.normal.x * outfieldM,
    y: sample.position.y - sample.tangent.y * alongM - sample.normal.y * outfieldM,
  };
  return toSvgPoint(label.x, label.y);
}

export function sprintChuteSegment(lane: LaneDefinition): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  const start = lanes.visualPosition(sprintStraight.sampleAtDistance(0), lane);
  const tangent = lanes.visualPosition(
    sprintStraight.sampleAtDistance(SPRINT_CHUTE_EXTENSION_M),
    lane,
  );
  const from = toSvgPoint(start.x, start.y);
  const to = toSvgPoint(tangent.x, tangent.y);
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
}

export interface DistanceMarkView {
  distanceM: number;
  label: string;
  tick: ScreenPoint;
  labelPoint: ScreenPoint;
  tickSegment: { x1: number; y1: number; x2: number; y2: number };
}

export function distanceMarkViews(): DistanceMarkView[] {
  return DISTANCE_MARKS_M.map((distanceM) => {
    const sample = stadiumTrack.sampleForRace(CANONICAL_LAP_M, distanceM);
    const tickWorld = lanes.visualPosition(sample, COMPARISON_INNER_LANE);
    const tick = toSvgPoint(tickWorld.x, tickWorld.y);
    const half = DISTANCE_TICK_M / 2;
    const start = toSvgPoint(
      tickWorld.x - sample.normal.x * half,
      tickWorld.y - sample.normal.y * half,
    );
    const end = toSvgPoint(
      tickWorld.x + sample.normal.x * half,
      tickWorld.y + sample.normal.y * half,
    );
    const labelWorld = {
      x: tickWorld.x + sample.normal.x * DISTANCE_LABEL_INFIELD_M,
      y: tickWorld.y + sample.normal.y * DISTANCE_LABEL_INFIELD_M,
    };

    return {
      distanceM,
      label: `${distanceM}m`,
      tick,
      labelPoint: toSvgPoint(labelWorld.x, labelWorld.y),
      tickSegment: { x1: start.x, y1: start.y, x2: end.x, y2: end.y },
    };
  });
}

export function athleteMarkerLayouts(
  raceDistanceM: number,
  athletes: readonly TrackAthleteView[],
  laneOrderIds: readonly string[] = athletes.map((athlete) => athlete.id),
): AthleteMarkerLayout[] {
  const assignments = lanes.assign(laneOrderIds);
  const course = createRaceCourse(raceDistanceM);
  const alongLabelM = course.type === "sprint-straight" ? 9 : 0;

  return athletes.map((athlete) => {
    const assigned = assignments.find((entry) => entry.athleteId === athlete.id);
    const lane = assigned?.lane ?? COMPARISON_INNER_LANE;
    const sample = course.sampleAtDistance(athlete.distanceCoveredM);
    const position = lanes.visualPosition(sample, lane);
    const labelOffsetM =
      lane.visualOffsetM === 0
        ? LABEL_INFIELD_M
        : lane.visualOffsetM - LABEL_OUTFIELD_EXTRA_M;
    const label = {
      x: sample.position.x + sample.tangent.x * alongLabelM + sample.normal.x * labelOffsetM,
      y: sample.position.y + sample.tangent.y * alongLabelM + sample.normal.y * labelOffsetM,
    };

    return {
      id: athlete.id,
      name: athlete.name,
      distanceCoveredM: athlete.distanceCoveredM,
      laneNumber: lane.laneNumber,
      marker: toSvgPoint(position.x, position.y),
      label: toSvgPoint(label.x, label.y),
    };
  });
}

function sampleLanePoints(lane: LaneDefinition): ScreenPoint[] {
  const points: ScreenPoint[] = [];
  for (let distanceM = 0; distanceM <= CANONICAL_LAP_M; distanceM += SAMPLE_STEP_M) {
    const sample = stadiumTrack.sampleAtDistanceAroundLap(distanceM);
    const position = lanes.visualPosition(sample, lane);
    points.push(toSvgPoint(position.x, position.y));
  }
  return points;
}

function crossTrackSegment(
  distanceAroundLapM: number,
  lengthM: number,
): { x1: number; y1: number; x2: number; y2: number } {
  return crossSampleSegment(stadiumTrack.sampleAtDistanceAroundLap(distanceAroundLapM), lengthM);
}

function crossSampleSegment(
  sample: TrackSample,
  lengthM: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const half = lengthM / 2;
  const start = toSvgPoint(
    sample.position.x - sample.normal.x * half,
    sample.position.y - sample.normal.y * half,
  );
  const end = toSvgPoint(
    sample.position.x + sample.normal.x * half,
    sample.position.y + sample.normal.y * half,
  );
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}
