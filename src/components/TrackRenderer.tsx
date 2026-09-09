import {
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  VISUAL_LANE_STROKE_M,
} from "@/domain/track";
import {
  MARKER_RADIUS_M,
  athleteMarkerLayouts,
  courseTypeForView,
  distanceMarkViews,
  finishLineSegment,
  infieldPolygonPoints,
  laneLinePoints,
  SPRINT_START_LABEL,
  sprintChuteSegment,
  sprintStartLabelPoint,
  sprintStartSegment,
  startTickSegment,
  trackViewBox,
} from "./trackView";
import type { TrackAthleteView } from "./trackView";

const MARKER_FILLS = ["fill-sky-600", "fill-amber-500"] as const;

export function TrackRenderer({
  raceDistanceM,
  athletes,
  ghosts = [],
  laneStrokeM = VISUAL_LANE_STROKE_M,
}: {
  raceDistanceM: number;
  athletes: readonly TrackAthleteView[];
  ghosts?: readonly TrackAthleteView[];
  laneStrokeM?: number;
}) {
  const viewBox = trackViewBox();
  const finish = finishLineSegment();
  const start = startTickSegment(raceDistanceM);
  const courseType = courseTypeForView(raceDistanceM);
  const sprintStart = courseType === "sprint-straight" ? sprintStartSegment() : null;
  const sprintStartLabel = courseType === "sprint-straight" ? sprintStartLabelPoint() : null;
  const chuteInner = sprintChuteSegment(COMPARISON_INNER_LANE);
  const chuteAdjacent = sprintChuteSegment(COMPARISON_ADJACENT_LANE);
  const laneOrderIds = athletes.map((athlete) => athlete.id);
  const markers = athleteMarkerLayouts(raceDistanceM, athletes);
  const ghostMarkers = athleteMarkerLayouts(raceDistanceM, ghosts, laneOrderIds);
  const startIsFinish = start === null && sprintStart === null;

  return (
    <svg
      role="img"
      aria-label="400 metre stadium race track"
      viewBox={viewBox.value}
      preserveAspectRatio="xMidYMid meet"
      data-race-distance-m={raceDistanceM}
      data-course-type={courseType}
      className="h-auto w-full max-w-3xl"
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
        x1={chuteInner.x1}
        y1={chuteInner.y1}
        x2={chuteInner.x2}
        y2={chuteInner.y2}
        stroke="currentColor"
        strokeWidth={laneStrokeM}
        className="text-zinc-800 dark:text-zinc-100"
        data-testid="sprint-chute-inner"
      />
      <line
        x1={chuteAdjacent.x1}
        y1={chuteAdjacent.y1}
        x2={chuteAdjacent.x2}
        y2={chuteAdjacent.y2}
        stroke="currentColor"
        strokeWidth={laneStrokeM}
        className="text-zinc-500 dark:text-zinc-400"
        data-testid="sprint-chute-adjacent"
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
      {sprintStart && sprintStartLabel ? (
        <g data-testid="sprint-start">
          <line
            x1={sprintStart.x1}
            y1={sprintStart.y1}
            x2={sprintStart.x2}
            y2={sprintStart.y2}
            stroke="currentColor"
            strokeWidth={1.4}
            className="text-emerald-600"
            data-testid="sprint-start-line"
          />
          <text
            x={sprintStartLabel.x}
            y={sprintStartLabel.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-emerald-700 dark:fill-emerald-400"
            fontSize={2.8}
            fontWeight={700}
            data-testid="sprint-start-label"
          >
            {SPRINT_START_LABEL}
          </text>
        </g>
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
        <g
          key={mark.label}
          data-testid={`distance-mark-${mark.distanceM}`}
          data-distance-around-m={mark.distanceM}
        >
          <line
            x1={mark.tickSegment.x1}
            y1={mark.tickSegment.y1}
            x2={mark.tickSegment.x2}
            y2={mark.tickSegment.y2}
            stroke="currentColor"
            strokeWidth={0.7}
            className="text-zinc-500 dark:text-zinc-400"
          />
          <circle
            cx={mark.tick.x}
            cy={mark.tick.y}
            r={0.7}
            className="fill-zinc-600 dark:fill-zinc-300"
            data-testid={`distance-mark-tick-${mark.distanceM}`}
          />
          <text
            x={mark.labelPoint.x}
            y={mark.labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-zinc-500 dark:fill-zinc-400"
            fontSize={2.8}
          >
            {mark.label}
          </text>
        </g>
      ))}
      {ghostMarkers.map((marker) => {
        const index = athletes.findIndex((athlete) => athlete.id === marker.id);
        return (
          <g
            key={`ghost-${marker.id}`}
            opacity={0.35}
            data-athlete-id={`ghost-${marker.id}`}
            data-distance-covered-m={marker.distanceCoveredM}
            data-lane-number={marker.laneNumber}
            data-testid={`athlete-ghost-${marker.id}`}
          >
            <circle
              cx={marker.marker.x}
              cy={marker.marker.y}
              r={MARKER_RADIUS_M}
              className={MARKER_FILLS[index] ?? "fill-zinc-700"}
            />
            <text
              x={marker.label.x}
              y={marker.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={MARKER_FILLS[index] ?? "fill-zinc-700"}
              fontSize={3}
              fontWeight={600}
            >
              {`${marker.name} gap`}
            </text>
          </g>
        );
      })}
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
