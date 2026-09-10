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
  PIN_STEM_M,
  athleteMarkerLayouts,
  distanceMarkViews,
  finishLineSegment,
  infieldPolygonPoints,
  laneLinePoints,
  runnerLanePath,
  sprintChuteView,
  startTickSegment,
  trackInnerOffsetM,
  trackOuterDiskPath,
  trackSurfacePath,
  trackViewBox,
  visualLaneBoundaryOffsetsM,
  visualLaneCount,
  visualLaneLinePoints,
} from "./trackView";
import type { TrackAthleteView } from "./trackView";

const MARKER_FILLS = [athleteColors.A, athleteColors.B] as const;

function markerPinPath(x: number, y: number): string {
  const headCy = y - PIN_STEM_M;
  const joinY = headCy + MARKER_RADIUS_M * 0.32;
  const spread = MARKER_RADIUS_M * 0.56;
  return `M ${x} ${y} L ${x - spread} ${joinY} L ${x + spread} ${joinY} Z`;
}

function MarkerPin({
  x,
  y,
  fill,
  initials,
  testId,
}: {
  x: number;
  y: number;
  fill: string;
  initials?: string;
  testId?: string;
}) {
  const headCy = y - PIN_STEM_M;
  return (
    <>
      <circle cx={x} cy={y} r={0.55} fill={fill} data-testid={testId} />
      <g filter="url(#marker-pin-shadow)">
        <path
          d={markerPinPath(x, y)}
          fill={fill}
          stroke="white"
          strokeWidth={0.4}
          strokeLinejoin="round"
        />
        <circle
          cx={x}
          cy={headCy}
          r={MARKER_RADIUS_M}
          fill={fill}
          stroke="white"
          strokeWidth={0.45}
        />
      </g>
      {initials ? (
        <text
          x={x}
          y={headCy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={2.9}
          fontWeight={700}
        >
          {initials}
        </text>
      ) : null}
    </>
  );
}

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
  const laneCount = visualLaneCount(athletes.length);
  const finish = finishLineSegment(laneCount);
  const start = startTickSegment(raceDistanceM, laneCount);
  const courseType = courseTypeForRace(raceDistanceM);
  const chute = courseType === "sprint-straight" ? sprintChuteView(laneCount) : null;
  const laneOrderIds = athletes.map((athlete) => athlete.id);
  const markers = athleteMarkerLayouts(raceDistanceM, athletes);
  const ghostMarkers = athleteMarkerLayouts(raceDistanceM, ghosts, laneOrderIds);
  const startIsFinish = start === null && chute === null;
  const surfacePath = trackSurfacePath(laneCount);
  const ovalScenery = (
    <>
      <g mask="url(#track-outer-shadow-mask)">
        <path
          d={trackOuterDiskPath(laneCount)}
          className="fill-track"
          filter="url(#track-outer-shadow)"
        />
      </g>
      <path
        d={surfacePath}
        className="fill-track"
        fillRule="evenodd"
        data-testid="track-surface"
      />
      <path d={surfacePath} fill="url(#track-shade)" fillRule="evenodd" />
      <path
        d={surfacePath}
        fill="none"
        fillRule="evenodd"
        stroke="white"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      {athletes.map((athlete, index) => (
        <path
          key={athlete.id}
          d={runnerLanePath(index)}
          fill="none"
          data-testid={`runner-track-${athlete.id}`}
          data-lane-number={index + 1}
        />
      ))}
      <polygon
        points={infieldPolygonPoints()}
        className="fill-infield"
        data-testid="track-infield"
      />
      <g clipPath="url(#infield-clip)" mask="url(#infield-shadow-mask)">
        <polyline
          points={visualLaneLinePoints(trackInnerOffsetM() + 0.85)}
          fill="none"
          stroke="#2C3418"
          strokeWidth={2.2}
          strokeLinejoin="round"
          opacity={0.2}
          filter="url(#infield-kerb-shadow)"
        />
      </g>
      {visualLaneBoundaryOffsetsM(laneCount).map((offsetM) => (
        <polyline
          key={offsetM}
          points={visualLaneLinePoints(offsetM)}
          fill="none"
          stroke="var(--rmr-lane-line)"
          strokeWidth={0.35}
          strokeLinejoin="round"
        />
      ))}
      <polyline
        points={laneLinePoints(COMPARISON_INNER_LANE)}
        fill="none"
        stroke="var(--rmr-lane-line)"
        strokeWidth={laneStrokeM}
        opacity={0}
        data-testid="lane-inner"
      />
      <polyline
        points={laneLinePoints(COMPARISON_ADJACENT_LANE)}
        fill="none"
        stroke="var(--rmr-lane-line)"
        strokeWidth={laneStrokeM}
        opacity={0}
        data-testid="lane-adjacent"
      />
    </>
  );

  return (
    <svg
      role="img"
      aria-label="400 metre stadium race track"
      viewBox={viewBox.value}
      preserveAspectRatio="xMidYMid meet"
      data-race-distance-m={raceDistanceM}
      data-course-type={courseType}
      data-runner-count={laneCount}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="track-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--rmr-track-light)" stopOpacity="0.35" />
          <stop offset="55%" stopColor="var(--rmr-track)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--rmr-track-dark)" stopOpacity="0.28" />
        </linearGradient>
        <filter id="marker-pin-shadow" x="-70%" y="-50%" width="240%" height="260%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="1.05" floodColor="#111318" floodOpacity="0.45" />
        </filter>
        <clipPath id="infield-clip">
          <polygon points={infieldPolygonPoints()} />
        </clipPath>
        <linearGradient
          id="infield-shadow-fade"
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={viewBox.minY}
          x2={0}
          y2={0}
        >
          <stop offset="0" stopColor="white" />
          <stop offset="0.72" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask
          id="infield-shadow-mask"
          maskUnits="userSpaceOnUse"
          x={viewBox.minX}
          y={viewBox.minY}
          width={viewBox.width}
          height={viewBox.height}
        >
          <rect
            x={viewBox.minX}
            y={viewBox.minY}
            width={viewBox.width}
            height={viewBox.height}
            fill="url(#infield-shadow-fade)"
          />
        </mask>
        <filter id="infield-kerb-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.15" />
        </filter>
        <linearGradient
          id="track-outer-shadow-fade"
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={0}
          y2={viewBox.minY + viewBox.height}
        >
          <stop offset="0" stopColor="black" />
          <stop offset="0.42" stopColor="black" />
          <stop offset="0.72" stopColor="white" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <mask
          id="track-outer-shadow-mask"
          maskUnits="userSpaceOnUse"
          x={viewBox.minX}
          y={viewBox.minY}
          width={viewBox.width}
          height={viewBox.height}
        >
          <rect
            x={viewBox.minX}
            y={viewBox.minY}
            width={viewBox.width}
            height={viewBox.height}
            fill="url(#track-outer-shadow-fade)"
          />
        </mask>
        <filter id="track-outer-shadow" x="-8%" y="-4%" width="116%" height="128%">
          <feDropShadow dx="0" dy="2.6" stdDeviation="1.6" floodColor="#1A1F14" floodOpacity="0.28" />
        </filter>
      </defs>
      <rect
        x={viewBox.minX}
        y={viewBox.minY}
        width={viewBox.width}
        height={viewBox.height}
        className="fill-page"
      />
      {chute ? <g opacity={0.34}>{ovalScenery}</g> : ovalScenery}
      {chute ? (
        <>
          <polygon
            points={chute.surfacePoints}
            className="fill-track"
            filter="url(#track-outer-shadow)"
          />
          <polygon
            points={chute.surfacePoints}
            className="fill-track"
            data-testid="sprint-chute"
          />
          <polygon points={chute.surfacePoints} fill="url(#track-shade)" />
          <polygon
            points={chute.surfacePoints}
            fill="none"
            stroke="white"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          {chute.laneLines.map((line) => (
            <polyline
              key={line.offsetM}
              points={line.points}
              fill="none"
              stroke="var(--rmr-lane-line)"
              strokeWidth={0.35}
              strokeLinejoin="round"
              data-testid={`sprint-chute-lane-${line.offsetM}`}
            />
          ))}
        </>
      ) : null}
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
            dominantBaseline="middle"
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
            <MarkerPin x={marker.marker.x} y={marker.marker.y} fill={fill} initials={athleteInitials(marker.name)} />
            <rect
              x={marker.label.x - 10}
              y={marker.label.y - 2.4}
              width={20}
              height={4.8}
              rx={1.4}
              fill={fill}
            />
            <text
              x={marker.label.x}
              y={marker.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
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
            <MarkerPin
              x={marker.marker.x}
              y={marker.marker.y}
              fill={fill}
              initials={athleteInitials(marker.name)}
              testId={`athlete-marker-${marker.id}`}
            />
            <rect
              x={marker.label.x - 9}
              y={marker.label.y - 2.3}
              width={18}
              height={4.6}
              rx={1.4}
              fill={fill}
            />
            <text
              x={marker.label.x}
              y={marker.label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
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
