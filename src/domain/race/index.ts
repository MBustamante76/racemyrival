export { RaceEngine } from "./RaceEngine";
export { assertTwoAthletes, requireTwoAthletes } from "./athletes";
export { ConstantPaceModel } from "./ConstantPaceModel";
export {
  averageSpeedMps,
  clamp,
  completedLaps,
  currentLapProgress,
  currentLeadM,
  deriveAthleteState,
  firstFinishTimeMs,
  isTie,
  pacePer100mMs,
  pacePer400mMs,
  raceProgress,
  relativeSpeed,
  timeGapMs,
  totalLaps,
  winnerIdFromFinishTimes,
} from "./calculations";
export { CANONICAL_LAP_M, METRES_PER_MILE, PHASE1_ATHLETE_COUNT } from "./constants";
export { RACE_DISTANCES, raceDistanceById } from "./distances";
export { raceResultFromPaceModels } from "./result";
export { formatRaceTime, parseRaceTime } from "./time";
export type {
  AthleteCountError,
  RequireTwoAthletesResult,
  TwoAthletes,
} from "./athletes";
export type {
  AthleteDistanceSample,
  AthleteId,
  AthleteInput,
  AthletePaceBinding,
  AthleteRaceState,
  PaceCheckpoint,
  PaceModel,
  ParseRaceTimeError,
  ParseRaceTimeResult,
  RaceConfiguration,
  RaceDistanceOption,
  RaceResult,
  RaceSnapshot,
  RaceStatus,
  RaceTelemetry,
  TrackSample,
  Vec2,
} from "./types";
