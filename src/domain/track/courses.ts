import { SPRINT_STRAIGHT_M } from "./constants";
import { sprintStraight } from "./SprintStraightGeometry";
import { stadiumTrack } from "./StadiumTrackGeometry";
import type { TrackGeometry } from "./types";
import type { TrackSample } from "../race/types";

export type CourseType = "oval" | "sprint-straight";

export interface RaceCourse {
  readonly type: CourseType;
  readonly lengthM: number;
  sampleAtDistance(distanceCoveredM: number): TrackSample;
}

export function courseTypeForRace(raceDistanceM: number): CourseType {
  return raceDistanceM === SPRINT_STRAIGHT_M ? "sprint-straight" : "oval";
}

export function createRaceCourse(raceDistanceM: number): RaceCourse {
  if (courseTypeForRace(raceDistanceM) === "sprint-straight") {
    return new SprintStraightCourse();
  }

  return new OvalRaceCourse(raceDistanceM);
}

export class OvalRaceCourse implements RaceCourse {
  readonly type = "oval" as const;

  constructor(
    readonly lengthM: number,
    private readonly geometry: TrackGeometry = stadiumTrack,
  ) {}

  sampleAtDistance(distanceCoveredM: number): TrackSample {
    return this.geometry.sampleForRace(this.lengthM, distanceCoveredM);
  }
}

export class SprintStraightCourse implements RaceCourse {
  readonly type = "sprint-straight" as const;
  readonly lengthM = SPRINT_STRAIGHT_M;

  constructor(private readonly geometry: SprintStraightGeometryLike = sprintStraight) {}

  sampleAtDistance(distanceCoveredM: number): TrackSample {
    return this.geometry.sampleAtDistance(distanceCoveredM);
  }
}

interface SprintStraightGeometryLike {
  sampleAtDistance(distanceCoveredM: number): TrackSample;
}
