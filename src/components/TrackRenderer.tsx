import {
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  VISUAL_LANE_STROKE_M,
} from "@/domain/track";
import {
  MARKER_RADIUS_M,
  athleteMarkerLayouts,
  distanceMarkViews,
  finishLineSegment,
  infieldPolygonPoints,
  laneLinePoints,
  startTickSegment,
  trackViewBox,
} from "./trackView";
import type { TrackAthleteView } from "./trackView";

const MARKER_FILLS = ["fill-sky-600", "fill-amber-500"] as const;

export function TrackRenderer({
  raceDistanceM,
  athletes,
  laneStrokeM = VISUAL_LANE_STROKE_M,
}: {
  raceDistanceM: number;
  athletes: readonly TrackAthleteView[];
  laneStrokeM?: number;
}) {
  const viewBox = trackViewBox();
  const finish = finishLineSegment();
  const start = startTickSegment(raceDistanceM);
  const markers = athleteMarkerLayouts(raceDistanceM, athletes);
  const startIsFinish = start === null;

  return (
    <svg
      role="img"
      aria-label="400 metre stadium race track"
      viewBox={viewBox.value}
      preserveAspectRatio="xMidYMid meet"
      data-race-distance-m={raceDistanceM}
      className="w-full max-w-3xl"
    >
      <rect
        x={viewBox.minX}
        y={viewBox.minY}
        width={viewBox.width}
        height={viewBox.height}
        className="fill-zinc-100 dark:fill-zinc-900"
      />
      <polygon
        points={infieldPolygonPoints()}
        className="fill-zinc-200/80 dark:fill-zinc-800/90"
        data-testid="track-infield"
      />
      <polyline
        points={laneLinePoints(COMPARISON_INNER_LANE)}
        fill="none"
        stroke="currentColor"
        strokeWidth={laneStrokeM}
        className="text-zinc-800 dark:text-zinc-100"
        data-testid="lane-inner"
      />
      <polyline
        points={laneLinePoints(COMPARISON_ADJACENT_LANE)}
        fill="none"
        stroke="currentColor"
        strokeWidth={laneStrokeM}
        className="text-zinc-500 dark:text-zinc-400"
        data-testid="lane-adjacent"
      />
      <line
        x1={finish.x1}
        y1={finish.y1}
        x2={finish.x2}
        y2={finish.y2}
        stroke="currentColor"
        strokeWidth={1.2}
        className="text-rose-600"
        data-testid="finish-line"
      />
      {start ? (
        <line
          x1={start.x1}
          y1={start.y1}
          x2={start.x2}
          y2={start.y2}
          stroke="currentColor"
          strokeWidth={1.2}
          className="text-emerald-600"
          data-testid="start-line"
        />
      ) : null}
      <text
        x={(finish.x1 + finish.x2) / 2}
        y={finish.y1 - 2.2}
        textAnchor="middle"
        className="fill-rose-700 dark:fill-rose-400"
        fontSize={3}
        data-testid="finish-label"
      >
        {startIsFinish ? "Start / Finish" : "Finish"}
      </text>
      {distanceMarkViews().map((mark) => (
        <text
          key={mark.label}
          x={mark.x}
          y={mark.y}
          textAnchor="middle"
          className="fill-zinc-500 dark:fill-zinc-400"
          fontSize={2.8}
        >
          {mark.label}
        </text>
      ))}
      {markers.map((marker, index) => (
        <g
          key={marker.id}
          data-athlete-id={marker.id}
          data-distance-covered-m={marker.distanceCoveredM}
          data-lane-number={marker.laneNumber}
        >
          <circle
            cx={marker.marker.x}
            cy={marker.marker.y}
            r={MARKER_RADIUS_M}
            className={MARKER_FILLS[index] ?? "fill-zinc-700"}
            data-testid={`athlete-marker-${marker.id}`}
          />
          <text
            x={marker.label.x}
            y={marker.label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={MARKER_FILLS[index] ?? "fill-zinc-700"}
            fontSize={3.4}
            fontWeight={600}
            data-testid={`athlete-label-${marker.id}`}
          >
            {marker.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

export type { TrackAthleteView };
