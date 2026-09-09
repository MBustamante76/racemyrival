import {
  add,
  CANONICAL_LAP_M,
  COMPARISON_INNER_LANE,
  STADIUM_BEND_RADIUS_M,
  STADIUM_STRAIGHT_M,
  STANDARD_LANE_WIDTH_M,
  courseForRace,
  courseTypeForRace,
  createLaneModel,
  scale,
  startOffsetM,
  stadiumTrack,
} from "@/domain/track";
import type { LaneDefinition } from "@/domain/track";

export const SAMPLE_STEP_M = 2;
export const PADDING_M = 12;
export const PRESENTATION_ASPECT = 3;
export const FINISH_LINE_M = 10;
export const START_TICK_M = 7;
export const MARKER_RADIUS_M = 2.2;
export const LABEL_INFIELD_M = 6.5;
export const LABEL_OUTFIELD_EXTRA_M = 6.5;
export const DISTANCE_LABEL_INFIELD_M = 5;
export const DISTANCE_TICK_M = 3;
export const DISTANCE_MARKS_M = [100, 200, 300] as const;
export const VISUAL_LANE_OFFSETS_M = [2.4, 0, -2.4, -4.8, -7.2, -9.6] as const;
export const SPRINT_CHUTE_M = 100;

const lanes = createLaneModel("comparison");
const offsetPointCache = new Map<number, ScreenPoint[]>();
const offsetLineCache = new Map<number, string>();

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
  const contentHalfWidth = STADIUM_STRAIGHT_M / 2 + STADIUM_BEND_RADIUS_M + PADDING_M;
  const halfHeight = svgNumber(STADIUM_BEND_RADIUS_M + PADDING_M);
  const halfWidth = svgNumber(Math.max(contentHalfWidth, halfHeight * PRESENTATION_ASPECT));
  return {
    minX: -halfWidth,
    minY: -halfHeight,
    width: svgNumber(halfWidth * 2),
    height: svgNumber(halfHeight * 2),
    value: `${-halfWidth} ${-halfHeight} ${halfWidth * 2} ${halfHeight * 2}`,
  };
}

export function laneLinePoints(lane: LaneDefinition): string {
  return sampleOffsetPoints(lane.visualOffsetM).map((point) => `${point.x},${point.y}`).join(" ");
}

export function visualLaneLinePoints(offsetM: number): string {
  const cached = offsetLineCache.get(offsetM);
  if (cached) {
    return cached;
  }
  const value = sampleOffsetPoints(offsetM).map((point) => `${point.x},${point.y}`).join(" ");
  offsetLineCache.set(offsetM, value);
  return value;
}

export function infieldPolygonPoints(): string {
  return closedRingPoints(COMPARISON_INNER_LANE.visualOffsetM + 2.2)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

export function trackSurfacePoints(): string {
  return trackSurfacePath();
}

export function trackSurfacePath(): string {
  return `${ringPath(closedRingPoints(-11))} ${ringPath(closedRingPoints(2.6))}`;
}

function closedRingPoints(offsetM: number): ScreenPoint[] {
  const points = sampleOffsetPoints(offsetM);
  if (points.length < 2) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.y === last.y) {
    return points.slice(0, -1);
  }

  return points;
}

function ringPath(points: ScreenPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")} Z`;
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
  if (courseTypeForRace(raceDistanceM) === "sprint-straight") {
    return null;
  }

  const startAroundM = startOffsetM(raceDistanceM);
  if (startAroundM === 0) {
    return null;
  }

  return crossTrackSegment(startAroundM, START_TICK_M);
}

export interface SprintChuteView {
  surfacePoints: string;
  startSegment: { x1: number; y1: number; x2: number; y2: number };
  label: ScreenPoint;
  start: ScreenPoint;
}

export function sprintChuteView(): SprintChuteView {
  const finish = stadiumTrack.sampleAtDistanceAroundLap(0);
  const startWorld = add(finish.position, scale(finish.tangent, -SPRINT_CHUTE_M));
  const half = 6;
  const corners = [
    add(startWorld, scale(finish.normal, -half)),
    add(finish.position, scale(finish.normal, -half)),
    add(finish.position, scale(finish.normal, half)),
    add(startWorld, scale(finish.normal, half)),
  ];
  const startInner = toSvgPoint(
    startWorld.x - finish.normal.x * half,
    startWorld.y - finish.normal.y * half,
  );
  const startOuter = toSvgPoint(
    startWorld.x + finish.normal.x * half,
    startWorld.y + finish.normal.y * half,
  );
  const labelWorld = add(startWorld, scale(finish.normal, -half - 4));

  return {
    surfacePoints: corners.map((point) => {
      const svg = toSvgPoint(point.x, point.y);
      return `${svg.x},${svg.y}`;
    }).join(" "),
    startSegment: { x1: startInner.x, y1: startInner.y, x2: startOuter.x, y2: startOuter.y },
    label: toSvgPoint(labelWorld.x, labelWorld.y),
    start: toSvgPoint(startWorld.x, startWorld.y),
  };
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
  options: { flipLabels?: boolean } = {},
): AthleteMarkerLayout[] {
  const assignments = lanes.assign(laneOrderIds);
  const course = courseForRace(raceDistanceM);

  return athletes.map((athlete) => {
    const assigned = assignments.find((entry) => entry.athleteId === athlete.id);
    const lane = assigned?.lane ?? COMPARISON_INNER_LANE;
    const sample = course.sampleForRace(raceDistanceM, athlete.distanceCoveredM);
    const position = lanes.visualPosition(sample, lane);
    const labelOffsetM = options.flipLabels
      ? -(lane.visualOffsetM === 0 ? LABEL_INFIELD_M : Math.abs(lane.visualOffsetM) + LABEL_OUTFIELD_EXTRA_M)
      : lane.visualOffsetM === 0
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

function sampleOffsetPoints(offsetM: number): ScreenPoint[] {
  const cached = offsetPointCache.get(offsetM);
  if (cached) {
    return cached;
  }

  const lane: LaneDefinition = {
    laneNumber: 0,
    widthM: STANDARD_LANE_WIDTH_M,
    visualOffsetM: offsetM,
  };
  const points: ScreenPoint[] = [];
  for (let distanceM = 0; distanceM <= CANONICAL_LAP_M; distanceM += SAMPLE_STEP_M) {
    const sample = stadiumTrack.sampleAtDistanceAroundLap(distanceM);
    const position = lanes.visualPosition(sample, lane);
    points.push(toSvgPoint(position.x, position.y));
  }
  offsetPointCache.set(offsetM, points);
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
