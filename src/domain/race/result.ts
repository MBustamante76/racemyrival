import { currentLeadM, isTie, timeGapMs, winnerIdFromFinishTimes } from "./calculations";
import type { AthleteId, PaceModel, RaceResult, RaceSnapshot } from "./types";

function distanceFor(id: AthleteId, paceA: PaceModel, paceB: PaceModel, elapsedMs: number): number {
  return id === "A" ? paceA.distanceAt(elapsedMs) : paceB.distanceAt(elapsedMs);
}

export function raceResultFromPaceModels(paceA: PaceModel, paceB: PaceModel): RaceResult {
  const tied = isTie(paceA.finishTimeMs, paceB.finishTimeMs);
  const winnerId = winnerIdFromFinishTimes(paceA.finishTimeMs, paceB.finishTimeMs);
  const winningTimeMs = Math.min(paceA.finishTimeMs, paceB.finishTimeMs);

  const athleteADistanceM = paceA.distanceAt(winningTimeMs);
  const athleteBDistanceM = paceB.distanceAt(winningTimeMs);

  const snapshot: RaceSnapshot = {
    raceTimeMs: winningTimeMs,
    athleteADistanceM,
    athleteBDistanceM,
    leadM: currentLeadM(athleteADistanceM, athleteBDistanceM),
    winnerId,
  };

  if (tied) {
    return {
      winnerId: null,
      isTie: true,
      winningTimeMs,
      timeGapMs: 0,
      distanceGapAtWinnerFinishM: 0,
      snapshot: {
        ...snapshot,
        leadM: 0,
        winnerId: null,
      },
    };
  }

  const loserId: AthleteId = winnerId === "A" ? "B" : "A";
  const loserDistanceM = distanceFor(loserId, paceA, paceB, winningTimeMs);
  const raceDistanceM = winnerId === "A" ? paceA.totalDistanceM : paceB.totalDistanceM;

  return {
    winnerId,
    isTie: false,
    winningTimeMs,
    timeGapMs: timeGapMs(paceA.finishTimeMs, paceB.finishTimeMs),
    distanceGapAtWinnerFinishM: raceDistanceM - loserDistanceM,
    snapshot,
  };
}
