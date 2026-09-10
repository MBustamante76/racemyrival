import { stadiumTrack } from "./StadiumTrackGeometry";
import { sprintStraight } from "./SprintStraightGeometry";
import type { TrackGeometry } from "./types";

export type RaceCourseType = "stadium-oval" | "sprint-straight";

export function courseTypeForRace(distanceM: number): RaceCourseType {
  return distanceM === 100 ? "sprint-straight" : "stadium-oval";
}

export function courseForRace(distanceM: number): TrackGeometry {
  return courseTypeForRace(distanceM) === "sprint-straight" ? sprintStraight : stadiumTrack;
}
