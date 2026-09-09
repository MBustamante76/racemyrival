import {
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  VISUAL_LANE_STROKE_M,
  courseTypeForRace,
} from "@/domain/track";
import { athleteColors, colors } from "@/styles/tokens";
import { athleteInitials } from "./athleteDisplay";
import {
  MARKER_RADIUS_M,
  VISUAL_LANE_OFFSETS_M,
  athleteMarkerLayouts,
  distanceMarkViews,
  finishLineSegment,
  infieldPolygonPoints,
  laneLinePoints,
  sprintChuteView,
  startTickSegment,
  trackSurfacePoints,
  trackViewBox,
  visualLaneLinePoints,
} from "./trackView";
import type { TrackAthleteView } from "./trackView";

const MARKER_FILLS = [athleteColors.A, athleteColors.B] as const;

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
  const courseType = courseTypeForRace(raceDistanceM);
  const chute = courseType === "sprint-straight" ? sprintChuteView() : null;
  const laneOrderIds = athletes.map((athlete) => athlete.id);
  const markers = athleteMarkerLayouts(raceDistanceM, athletes);
  const ghostMarkers = athleteMarkerLayouts(raceDistanceM, ghosts, laneOrderIds);
  const startIsFinish = start === null && chute === null;

  return (
    <svg
      role="img"
      aria-label="400 metre stadium race track"
      viewBox={viewBox.value}
      preserveAspectRatio="xMidYMid meet"
      data-race-distance-m={raceDistanceM}
      data-course-type={courseType}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="track-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--rmr-track-light)" stopOpacity="0.35" />
          <stop offset="55%" stopColor="var(--rmr-track)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--rmr-track-dark)" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <rect
        x={viewBox.minX}
        y={viewBox.minY}
        width={viewBox.width}
        height={viewBox.height}
        className="fill-page"
      />
      {chute ? (
        <polygon
          points={chute.surfacePoints}
          className="fill-track"
          data-testid="sprint-chute"
        />
      ) : null}
      <polygon points={trackSurfacePoints()} className="fill-track" data-testid="track-surface" />
      <polygon points={trackSurfacePoints()} fill="url(#track-shade)" />
      <polygon
        points={infieldPolygonPoints()}
        className="fill-infield"
        data-testid="track-infield"
      />
      {VISUAL_LANE_OFFSETS_M.map((offsetM) => (
        <polyline
          key={offsetM}
          points={visualLaneLinePoints(offsetM)}
          fill="none"
          stroke="var(--rmr-lane-line)"
          strokeWidth={0.45}
        />
      ))}
      <polyline
        points={laneLinePoints(COMPARISON_INNER_LANE)}
        fill="none"
        stroke="var(--rmr-lane-line)"
        strokeWidth={laneStrokeM}
        data-testid="lane-inner"
      />
      <polyline
        points={laneLinePoints(COMPARISON_ADJACENT_LANE)}
        fill="none"
        stroke="var(--rmr-lane-line)"
        strokeWidth={laneStrokeM}
        data-testid="lane-adjacent"
      />
      <line
        x1={finish.x1}
        y1={finish.y1}
        x2={finish.x2}
        y2={finish.y2}
        stroke="white"
        strokeWidth={1.2}
        data-testid="finish-line"
      />
      {start ? (
        <line
          x1={start.x1}
          y1={start.y1}
          x2={start.x2}
          y2={start.y2}
          stroke="white"
          strokeWidth={1.2}
          data-testid="start-line"
        />
      ) : null}
      {chute ? (
        <>
          <line
            x1={chute.startSegment.x1}
            y1={chute.startSegment.y1}
            x2={chute.startSegment.x2}
            y2={chute.startSegment.y2}
            stroke="white"
            strokeWidth={1.1}
            data-testid="sprint-start-line"
          />
          <text
            x={chute.label.x}
            y={chute.label.y}
            textAnchor="middle"
            className="fill-brand-navy"
            fontSize={3}
            fontWeight={700}
            data-testid="sprint-start-label"
          >
            START 100m
          </text>
        </>
      ) : null}
      <text
        x={(finish.x1 + finish.x2) / 2}
        y={finish.y1 - 2.2}
        textAnchor="middle"
        className="fill-brand-navy"
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
            stroke="white"
            strokeWidth={0.7}
          />
          <circle
            cx={mark.tick.x}
            cy={mark.tick.y}
            r={0.7}
            className="fill-brand-navy"
            data-testid={`distance-mark-tick-${mark.distanceM}`}
          />
          <text
            x={mark.labelPoint.x}
            y={mark.labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-brand-navy"
            fontSize={2.8}
          >
            {mark.label}
          </text>
        </g>
      ))}
      {ghostMarkers.map((marker) => {
        const index = athletes.findIndex((athlete) => athlete.id === marker.id);
        const fill = MARKER_FILLS[index] ?? colors.muted;
        return (
          <g
            key={`ghost-${marker.id}`}
            opacity={0.4}
            data-athlete-id={`ghost-${marker.id}`}
            data-distance-covered-m={marker.distanceCoveredM}
            data-lane-number={marker.laneNumber}
            data-testid={`athlete-ghost-${marker.id}`}
          >
            <circle
              cx={marker.marker.x}
              cy={marker.marker.y}
              r={MARKER_RADIUS_M + 0.7}
              fill="none"
              stroke={fill}
              strokeWidth={0.55}
            />
            <circle
              cx={marker.marker.x}
              cy={marker.marker.y}
              r={MARKER_RADIUS_M}
              fill={fill}
            />
            <rect
              x={marker.label.x - 10}
              y={marker.label.y - 2.4}
              width={20}
              height={4.8}
              rx={1.4}
              fill="white"
              opacity={0.75}
            />
            <text
              x={marker.label.x}
              y={marker.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={fill}
              fontSize={2.6}
              fontWeight={600}
            >
              {`${marker.name} gap`}
            </text>
          </g>
        );
      })}
      {markers.map((marker, index) => {
        const fill = MARKER_FILLS[index] ?? colors.muted;
        return (
          <g
            key={marker.id}
            data-athlete-id={marker.id}
            data-distance-covered-m={marker.distanceCoveredM}
            data-lane-number={marker.laneNumber}
          >
            <circle
              cx={marker.marker.x}
              cy={marker.marker.y}
              r={MARKER_RADIUS_M + 0.55}
              fill="white"
            />
            <circle
              cx={marker.marker.x}
              cy={marker.marker.y}
              r={MARKER_RADIUS_M}
              fill={fill}
              data-testid={`athlete-marker-${marker.id}`}
            />
            <text
              x={marker.marker.x}
              y={marker.marker.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={2.1}
              fontWeight={700}
            >
              {athleteInitials(marker.name)}
            </text>
            <rect
              x={marker.label.x - 9}
              y={marker.label.y - 2.3}
              width={18}
              height={4.6}
              rx={1.4}
              fill="white"
            />
            <text
              x={marker.label.x}
              y={marker.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={fill}
              fontSize={3}
              fontWeight={700}
              data-testid={`athlete-label-${marker.id}`}
            >
              {marker.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export type { TrackAthleteView };
