export { ConstantPaceModel } from "./ConstantPaceModel";
export {
  averageSpeedMps,
  clamp,
  completedLaps,
  currentLapProgress,
  currentLeadM,
  deriveAthleteState,
  isTie,
  pacePer100mMs,
  pacePer400mMs,
  raceProgress,
  relativeSpeed,
  timeGapMs,
  totalLaps,
  winnerIdFromFinishTimes,
} from "./calculations";
export { CANONICAL_LAP_M, METRES_PER_MILE } from "./constants";
export { RACE_DISTANCES, raceDistanceById } from "./distances";
export { raceResultFromPaceModels } from "./result";
export { formatRaceTime, parseRaceTime } from "./time";
export type {
  AthleteId,
  AthleteInput,
  AthleteRaceState,
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
