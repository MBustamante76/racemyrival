export type AthleteId = "A" | "B";

export type RaceStatus = "idle" | "running" | "paused" | "finished";

export interface AthleteInput {
  id: AthleteId;
  name: string;
  finishTimeMs: number;
}

export interface RaceConfiguration {
  distanceM: number;
  athletes: [AthleteInput, AthleteInput];
}

export interface PaceModel {
  readonly totalDistanceM: number;
  readonly finishTimeMs: number;
  distanceAt(elapsedMs: number): number;
  speedAt?(elapsedMs: number): number;
}

export interface AthleteRaceState {
  id: AthleteId;
  name: string;
  finishTimeMs: number;
  distanceCoveredM: number;
  progress: number;
  completedLaps: number;
  currentLapProgress: number;
  speedMps: number;
  pacePer100mMs: number;
  pacePer400mMs: number;
  finished: boolean;
}

export interface RaceSnapshot {
  raceTimeMs: number;
  athleteADistanceM: number;
  athleteBDistanceM: number;
  leadM: number;
  winnerId: AthleteId | null;
}

export interface RaceResult {
  winnerId: AthleteId | null;
  isTie: boolean;
  winningTimeMs: number;
  timeGapMs: number;
  distanceGapAtWinnerFinishM: number;
  snapshot: RaceSnapshot;
}

export interface RaceTelemetry {
  raceTimeMs: number;
  status: RaceStatus;
  athletes: [AthleteRaceState, AthleteRaceState];
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface TrackSample {
  position: Vec2;
  tangent: Vec2;
  normal: Vec2;
  distanceAroundLapM: number;
  lapProgress: number;
}

export type ParseRaceTimeSuccess = {
  ok: true;
  milliseconds: number;
};

export type ParseRaceTimeFailure = {
  ok: false;
  error: ParseRaceTimeError;
};

export type ParseRaceTimeError =
  | "blank"
  | "zero"
  | "negative"
  | "malformed"
  | "seconds_out_of_range"
  | "non_numeric";

export type ParseRaceTimeResult = ParseRaceTimeSuccess | ParseRaceTimeFailure;

export interface RaceDistanceOption {
  id: string;
  label: string;
  distanceM: number;
}
