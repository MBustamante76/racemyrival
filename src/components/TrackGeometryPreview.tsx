import {
  CANONICAL_LAP_M,
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  STADIUM_BEND_RADIUS_M,
  STADIUM_STRAIGHT_M,
  VISUAL_LANE_STROKE_M,
  createLaneModel,
  stadiumTrack,
} from "@/domain/track";
import type { LaneDefinition } from "@/domain/track";

const lanes = createLaneModel("comparison");

const SAMPLE_STEP_M = 2;
const PADDING_M = 12;
const FINISH_LINE_M = 8;

function svgPoint(x: number, y: number): { x: number; y: number } {
  return { x, y: -y };
}

function laneLinePoints(lane: LaneDefinition): string {
  const points: string[] = [];
  for (let distanceM = 0; distanceM <= CANONICAL_LAP_M; distanceM += SAMPLE_STEP_M) {
    const sample = stadiumTrack.sampleAtDistanceAroundLap(distanceM);
    const position = lanes.visualPosition(sample, lane);
    const point = svgPoint(position.x, position.y);
    points.push(`${point.x},${point.y}`);
  }
  return points.join(" ");
}

function finishLineSegment(): { x1: number; y1: number; x2: number; y2: number } {
  const finish = stadiumTrack.sampleAtDistanceAroundLap(0);
  const half = FINISH_LINE_M / 2;
  const start = svgPoint(
    finish.position.x - finish.normal.x * half,
    finish.position.y - finish.normal.y * half,
  );
  const end = svgPoint(
    finish.position.x + finish.normal.x * half,
    finish.position.y + finish.normal.y * half,
  );
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

function markerAt(distanceM: number): { x: number; y: number; label: string } {
  const sample = stadiumTrack.sampleAtDistanceAroundLap(distanceM);
  const point = svgPoint(sample.position.x, sample.position.y);
  return { x: point.x, y: point.y, label: `${distanceM}m` };
}

export function TrackGeometryPreview({
  laneStrokeM = VISUAL_LANE_STROKE_M,
}: {
  laneStrokeM?: number;
} = {}) {
  const halfWidth = STADIUM_STRAIGHT_M / 2 + STADIUM_BEND_RADIUS_M + PADDING_M;
  const halfHeight = STADIUM_BEND_RADIUS_M + PADDING_M;
  const viewBox = `${-halfWidth} ${-halfHeight} ${halfWidth * 2} ${halfHeight * 2}`;
  const finish = finishLineSegment();
  const markers = [0, 100, 200, 300].map(markerAt);

  return (
    <svg
      role="img"
      aria-label="400 metre stadium racing line"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="w-full max-w-3xl"
    >
      <rect
        x={-halfWidth}
        y={-halfHeight}
        width={halfWidth * 2}
        height={halfHeight * 2}
        className="fill-zinc-100 dark:fill-zinc-900"
      />
      <polyline
        points={laneLinePoints(COMPARISON_INNER_LANE)}
        fill="none"
        stroke="currentColor"
        strokeWidth={laneStrokeM}
        className="text-zinc-800 dark:text-zinc-100"
      />
      <polyline
        points={laneLinePoints(COMPARISON_ADJACENT_LANE)}
        fill="none"
        stroke="currentColor"
        strokeWidth={laneStrokeM}
        className="text-zinc-500 dark:text-zinc-400"
      />
      <line
        x1={finish.x1}
        y1={finish.y1}
        x2={finish.x2}
        y2={finish.y2}
        stroke="currentColor"
        strokeWidth={1.2}
        className="text-rose-600"
      />
      {markers.map((marker) => (
        <g key={marker.label}>
          <circle cx={marker.x} cy={marker.y} r={1.2} className="fill-zinc-800 dark:fill-zinc-100" />
          <text
            x={marker.x}
            y={marker.y - 2.5}
            textAnchor="middle"
            className="fill-zinc-600 dark:fill-zinc-300"
            fontSize={3.2}
          >
            {marker.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
