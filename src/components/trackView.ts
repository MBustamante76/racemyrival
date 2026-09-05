import {
  CANONICAL_LAP_M,
  COMPARISON_INNER_LANE,
  STADIUM_BEND_RADIUS_M,
  STADIUM_STRAIGHT_M,
  createLaneModel,
  startOffsetM,
  stadiumTrack,
} from "@/domain/track";
import type { LaneDefinition } from "@/domain/track";

export const SAMPLE_STEP_M = 2;
export const PADDING_M = 12;
export const FINISH_LINE_M = 10;
export const START_TICK_M = 7;
export const MARKER_RADIUS_M = 2.2;
export const LABEL_INFIELD_M = 6.5;
export const LABEL_OUTFIELD_EXTRA_M = 6.5;
export const DISTANCE_LABEL_INFIELD_M = 4;

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
  return { x, y: -y };
}

export function trackViewBox(): { minX: number; minY: number; width: number; height: number; value: string } {
  const halfWidth = STADIUM_STRAIGHT_M / 2 + STADIUM_BEND_RADIUS_M + PADDING_M;
  const halfHeight = STADIUM_BEND_RADIUS_M + PADDING_M;
  return {
    minX: -halfWidth,
    minY: -halfHeight,
    width: halfWidth * 2,
    height: halfHeight * 2,
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

export function startTickSegment(raceDistanceM: number): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} | null {
  const startAroundM = startOffsetM(raceDistanceM);
  if (startAroundM === 0) {
    return null;
  }

  return crossTrackSegment(startAroundM, START_TICK_M);
}

export function distanceMarkViews(): Array<ScreenPoint & { label: string }> {
  return [0, 100, 200, 300].map((distanceM) => {
    const sample = stadiumTrack.sampleAtDistanceAroundLap(distanceM);
    const position = toSvgPoint(
      sample.position.x + sample.normal.x * DISTANCE_LABEL_INFIELD_M,
      sample.position.y + sample.normal.y * DISTANCE_LABEL_INFIELD_M,
    );
    return { ...position, label: `${distanceM}m` };
  });
}

export function athleteMarkerLayouts(
  raceDistanceM: number,
  athletes: readonly TrackAthleteView[],
): AthleteMarkerLayout[] {
  const assignments = lanes.assign(athletes.map((athlete) => athlete.id));

  return athletes.map((athlete, index) => {
    const lane = assignments[index]?.lane ?? COMPARISON_INNER_LANE;
    const sample = stadiumTrack.sampleForRace(raceDistanceM, athlete.distanceCoveredM);
    const position = lanes.visualPosition(sample, lane);
    const labelOffsetM =
      lane.visualOffsetM === 0
        ? LABEL_INFIELD_M
        : lane.visualOffsetM - LABEL_OUTFIELD_EXTRA_M;
    const label = {
      x: sample.position.x + sample.normal.x * labelOffsetM,
      y: sample.position.y + sample.normal.y * labelOffsetM,
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
  const sample = stadiumTrack.sampleAtDistanceAroundLap(distanceAroundLapM);
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
