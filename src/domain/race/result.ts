import { assertTwoAthletes } from "./athletes";
import { currentLeadM, firstFinishTimeMs, isTie, timeGapMs, winnerIdFromFinishTimes } from "./calculations";
import type { AthletePaceBinding, RaceResult, RaceSnapshot } from "./types";

export function raceResultFromPaceModels(athletes: readonly AthletePaceBinding[]): RaceResult {
  const [first, second] = assertTwoAthletes(athletes);
  const pair = [first, second];
  const finishEntries = pair.map((athlete) => ({
    id: athlete.id,
    finishTimeMs: firstFinishTimeMs(athlete.pace),
  }));
  const tied = isTie(finishEntries);
  const winnerId = winnerIdFromFinishTimes(finishEntries);
  const winningTimeMs = Math.min(finishEntries[0].finishTimeMs, finishEntries[1].finishTimeMs);

  const samples = pair.map((athlete) => ({
    id: athlete.id,
    distanceM: athlete.pace.distanceAt(winningTimeMs),
  }));

  const snapshot: RaceSnapshot = {
    raceTimeMs: winningTimeMs,
    athletes: samples,
    leadM: currentLeadM(samples.map((sample) => sample.distanceM)),
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

  const winner = pair.find((athlete) => athlete.id === winnerId);
  const loser = pair.find((athlete) => athlete.id !== winnerId);
  if (!winner || !loser) {
    throw new Error("Winner and loser must both be present after a two-athlete result");
  }

  return {
    winnerId,
    isTie: false,
    winningTimeMs,
    timeGapMs: timeGapMs(finishEntries.map((entry) => entry.finishTimeMs)),
    distanceGapAtWinnerFinishM: winner.pace.totalDistanceM - loser.pace.distanceAt(winningTimeMs),
    snapshot,
  };
}
