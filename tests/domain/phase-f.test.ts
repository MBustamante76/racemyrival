import { describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  MAX_FRAME_DELTA_MS,
  RaceClock,
  RaceEngine,
  RaceSimulation,
} from "@/domain/race";
import type { RaceConfiguration, RaceSnapshot } from "@/domain/race";
import { StadiumTrackGeometry } from "@/domain/track";

const EIGHT_HUNDRED_M = 800;
const FOUR_HUNDRED_M = 400;
const FIFTEEN_HUNDRED_M = 1500;
const THREE_THOUSAND_M = 3000;
const FINISH_A_MS = 124_000;
const FINISH_B_MS = 112_000;

function twoAthleteConfig(
  distanceM: number,
  finishAMs: number,
  finishBMs: number,
): RaceConfiguration {
  return {
    distanceM,
    athletes: [
      { id: "A", name: "Marcelo", finishTimeMs: finishAMs },
      { id: "B", name: "Josh", finishTimeMs: finishBMs },
    ],
  };
}

function constantEngine(
  distanceM: number,
  finishAMs: number,
  finishBMs: number,
): RaceEngine {
  return new RaceEngine(twoAthleteConfig(distanceM, finishAMs, finishBMs), [
    new ConstantPaceModel(distanceM, finishAMs),
    new ConstantPaceModel(distanceM, finishBMs),
  ]);
}

function eightHundredSimulation(): RaceSimulation {
  return new RaceSimulation(constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS), new RaceClock());
}

function advance(race: RaceSimulation, fromWallMs: number, addElapsedMs: number): number {
  let wallMs = fromWallMs;
  let remainingMs = addElapsedMs;
  while (remainingMs > 0) {
    const stepMs = Math.min(MAX_FRAME_DELTA_MS, remainingMs);
    wallMs += stepMs;
    remainingMs -= stepMs;
    race.tick(wallMs);
  }
  return wallMs;
}

function expectSnapshotFrozen(first: RaceSnapshot, later: RaceSnapshot): void {
  expect(later.raceTimeMs).toBe(first.raceTimeMs);
  expect(later.winnerId).toBe(first.winnerId);
  expect(later.leadM).toBe(first.leadM);
  expect(later.athletes).toEqual(first.athletes);
}

describe("Test gate F", () => {
  it("800m 2:04 vs 1:52: both start together", () => {
    const race = eightHundredSimulation();
    const started = race.start(0);
    expect(started.status).toBe("running");
    expect(started.raceTimeMs).toBe(0);
    expect(started.winnerSnapshot).toBeNull();
    expect(started.result).toBeNull();
    expect(started.athletes.every((athlete) => athlete.distanceCoveredM === 0)).toBe(true);
    expect(started.athletes.every((athlete) => athlete.finished)).toBe(false);
  });

  it("800m: fast runner reaches 800m at 112s and slower is ~722.5806m", () => {
    const engine = constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS);
    const atWinner = engine.telemetryAt(FINISH_B_MS);

    expect(engine.firstFinishTimeMs()).toBe(FINISH_B_MS);
    expect(atWinner.status).toBe("running");
    expect(atWinner.result).toBeNull();
    expect(atWinner.athletes[1]?.finished).toBe(true);
    expect(atWinner.athletes[1]?.distanceCoveredM).toBe(EIGHT_HUNDRED_M);
    expect(atWinner.athletes[0]?.finished).toBe(false);
    expect(atWinner.athletes[0]?.distanceCoveredM).toBeCloseTo(722.5806, 4);
  });

  it("800m: winner snapshot gap is ~77.4194m and stays frozen", () => {
    const engine = constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS);
    const atWinner = engine.telemetryAt(FINISH_B_MS);
    const snapshot = atWinner.winnerSnapshot;

    expect(snapshot).not.toBeNull();
    expect(snapshot?.winnerId).toBe("B");
    expect(snapshot?.raceTimeMs).toBe(FINISH_B_MS);
    expect(snapshot?.leadM).toBeCloseTo(77.4194, 4);
    expect(snapshot?.athletes[0]?.distanceM).toBeCloseTo(722.5806, 4);
    expect(snapshot?.athletes[1]?.distanceM).toBe(EIGHT_HUNDRED_M);

    const later = engine.telemetryAt(120_000);
    expect(later.athletes[0]?.distanceCoveredM).toBeGreaterThan(722.5806);
    expect(later.athletes[0]?.distanceCoveredM).toBeLessThan(EIGHT_HUNDRED_M);
    expect(later.winnerSnapshot).not.toBeNull();
    expectSnapshotFrozen(snapshot as RaceSnapshot, later.winnerSnapshot as RaceSnapshot);
  });

  it("800m live simulation: slower continues and finishes at 124s with a 12s gap", () => {
    const race = eightHundredSimulation();
    race.start(0);
    advance(race, 0, FINISH_B_MS);

    const afterFirst = race.telemetry();
    expect(afterFirst.status).toBe("running");
    expect(afterFirst.result).toBeNull();
    expect(afterFirst.athletes[1]?.finished).toBe(true);
    expect(afterFirst.athletes[0]?.finished).toBe(false);
    expect(afterFirst.winnerSnapshot?.leadM).toBeCloseTo(77.4194, 4);

    const frozen = afterFirst.winnerSnapshot as RaceSnapshot;
    advance(race, FINISH_B_MS, FINISH_A_MS - FINISH_B_MS);

    const completed = race.telemetry();
    expect(completed.status).toBe("finished");
    expect(completed.athletes.every((athlete) => athlete.finished)).toBe(true);
    expect(completed.athletes.every((athlete) => athlete.distanceCoveredM === EIGHT_HUNDRED_M)).toBe(
      true,
    );
    expect(completed.result).not.toBeNull();
    expect(completed.result?.winnerId).toBe("B");
    expect(completed.result?.timeGapMs).toBe(12_000);
    expect(completed.result?.distanceGapAtWinnerFinishM).toBeCloseTo(77.4194, 4);
    expect(completed.result?.snapshot.raceTimeMs).toBe(FINISH_B_MS);
    expectSnapshotFrozen(frozen, completed.winnerSnapshot as RaceSnapshot);
  });

  it("status stays running after one finish and becomes finished after both", () => {
    const engine = constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS);
    expect(engine.telemetryAt(0).status).toBe("idle");
    expect(engine.telemetryAt(FINISH_B_MS - 1).status).toBe("running");
    expect(engine.telemetryAt(FINISH_B_MS).status).toBe("running");
    expect(engine.telemetryAt(FINISH_A_MS - 1).status).toBe("running");
    expect(engine.telemetryAt(FINISH_A_MS).status).toBe("finished");
  });

  it("finished athlete remains pinned at the finish while the slower continues", () => {
    const engine = constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS);
    const afterFirst = engine.telemetryAt(120_000);
    expect(afterFirst.athletes[1]?.distanceCoveredM).toBe(EIGHT_HUNDRED_M);
    expect(afterFirst.athletes[1]?.finished).toBe(true);
    expect(afterFirst.athletes[1]?.progress).toBe(1);
    expect(afterFirst.athletes[0]?.distanceCoveredM).toBeGreaterThan(722.5806);
    expect(afterFirst.athletes[0]?.finished).toBe(false);
  });

  it("no athlete distance exceeds the event distance", () => {
    const engine = constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS);
    for (const elapsedMs of [0, 1, FINISH_B_MS, 120_000, FINISH_A_MS, FINISH_A_MS + 60_000]) {
      for (const athlete of engine.telemetryAt(elapsedMs).athletes) {
        expect(athlete.distanceCoveredM).toBeLessThanOrEqual(EIGHT_HUNDRED_M);
      }
    }
  });

  it("exact tie is deterministic and does not pick a winner from update order", () => {
    const tiedMs = 112_000;
    const aFirst = constantEngine(EIGHT_HUNDRED_M, tiedMs, tiedMs);
    const bFirst = new RaceEngine(
      {
        distanceM: EIGHT_HUNDRED_M,
        athletes: [
          { id: "B", name: "Josh", finishTimeMs: tiedMs },
          { id: "A", name: "Marcelo", finishTimeMs: tiedMs },
        ],
      },
      [new ConstantPaceModel(EIGHT_HUNDRED_M, tiedMs), new ConstantPaceModel(EIGHT_HUNDRED_M, tiedMs)],
    );

    const aTelemetry = aFirst.telemetryAt(tiedMs);
    const bTelemetry = bFirst.telemetryAt(tiedMs);

    expect(aTelemetry.status).toBe("finished");
    expect(aTelemetry.winnerSnapshot?.winnerId).toBeNull();
    expect(aTelemetry.winnerSnapshot?.leadM).toBe(0);
    expect(aTelemetry.result?.isTie).toBe(true);
    expect(aTelemetry.result?.winnerId).toBeNull();
    expect(aTelemetry.result?.timeGapMs).toBe(0);

    expect(bTelemetry.winnerSnapshot?.winnerId).toBeNull();
    expect(bTelemetry.result?.winnerId).toBeNull();
    expect(bTelemetry.result?.isTie).toBe(true);
  });

  it("reset clears the winner snapshot", () => {
    const race = eightHundredSimulation();
    race.start(0);
    advance(race, 0, FINISH_A_MS);
    expect(race.telemetry().winnerSnapshot).not.toBeNull();
    expect(race.telemetry().result).not.toBeNull();

    const reset = race.reset();
    expect(reset.status).toBe("idle");
    expect(reset.raceTimeMs).toBe(0);
    expect(reset.winnerSnapshot).toBeNull();
    expect(reset.result).toBeNull();
    expect(reset.athletes.every((athlete) => athlete.distanceCoveredM === 0)).toBe(true);
  });

  it("clock does not stop when the first athlete finishes", () => {
    const race = eightHundredSimulation();
    race.start(0);
    advance(race, 0, FINISH_B_MS);
    expect(race.telemetry().status).toBe("running");
    expect(race.telemetry().athletes[1]?.finished).toBe(true);

    advance(race, FINISH_B_MS, 1_000);
    expect(race.telemetry().status).toBe("running");
    expect(race.telemetry().raceTimeMs).toBe(FINISH_B_MS + 1_000);
    expect(race.telemetry().athletes[0]?.distanceCoveredM).toBeGreaterThan(722.5806);
  });

  it("400m, 1500m, and 3000m finish through the same snapshot rules", () => {
    const cases = [
      { distanceM: FOUR_HUNDRED_M, finishAMs: 52_340, finishBMs: 48_000 },
      { distanceM: FIFTEEN_HUNDRED_M, finishAMs: 255_000, finishBMs: 240_000 },
      { distanceM: THREE_THOUSAND_M, finishAMs: 540_000, finishBMs: 510_000 },
    ];

    for (const raceCase of cases) {
      const engine = constantEngine(raceCase.distanceM, raceCase.finishAMs, raceCase.finishBMs);
      const before = engine.telemetryAt(raceCase.finishBMs - 1);
      const firstFinish = engine.telemetryAt(raceCase.finishBMs);
      const afterBoth = engine.telemetryAt(raceCase.finishAMs);

      expect(before.winnerSnapshot).toBeNull();
      expect(before.status).toBe("running");
      expect(firstFinish.status).toBe("running");
      expect(firstFinish.winnerSnapshot?.winnerId).toBe("B");
      expect(firstFinish.winnerSnapshot?.athletes[1]?.distanceM).toBe(raceCase.distanceM);
      expect(firstFinish.athletes[1]?.distanceCoveredM).toBe(raceCase.distanceM);
      expect(firstFinish.athletes[0]?.distanceCoveredM).toBeLessThan(raceCase.distanceM);
      expect(firstFinish.result).toBeNull();
      expect(afterBoth.status).toBe("finished");
      expect(afterBoth.result?.timeGapMs).toBe(raceCase.finishAMs - raceCase.finishBMs);
      expectSnapshotFrozen(
        firstFinish.winnerSnapshot as RaceSnapshot,
        afterBoth.winnerSnapshot as RaceSnapshot,
      );
    }
  });

  it("derived athlete state includes progress, laps, pace, and track-sampleable distance", () => {
    const engine = constantEngine(EIGHT_HUNDRED_M, FINISH_A_MS, FINISH_B_MS);
    const telemetry = engine.telemetryAt(FINISH_B_MS);
    const slower = telemetry.athletes[0];
    const faster = telemetry.athletes[1];
    const geometry = new StadiumTrackGeometry();

    expect(slower?.progress).toBeCloseTo(722.5806 / EIGHT_HUNDRED_M, 6);
    expect(slower?.completedLaps).toBe(1);
    expect(slower?.currentLapProgress).toBeCloseTo((722.5806 - 400) / 400, 6);
    expect(slower?.pacePer100mMs).toBeCloseTo(FINISH_A_MS * (100 / EIGHT_HUNDRED_M), 8);
    expect(slower?.pacePer400mMs).toBeCloseTo(FINISH_A_MS * (400 / EIGHT_HUNDRED_M), 8);
    expect(faster?.progress).toBe(1);
    expect(faster?.completedLaps).toBe(2);
    expect(faster?.currentLapProgress).toBe(0);

    const sample = geometry.sampleForRace(EIGHT_HUNDRED_M, slower?.distanceCoveredM ?? 0);
    expect(Number.isFinite(sample.position.x)).toBe(true);
    expect(Number.isFinite(sample.position.y)).toBe(true);
  });
});
