import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  RaceEngine,
  firstFinishTimeMs,
} from "@/domain/race";
import type { PaceCheckpoint, RaceConfiguration } from "@/domain/race";
import { NonlinearPaceModel } from "../helpers/nonlinear-pace-model";

const EIGHT_HUNDRED_M = 800;
const ATHLETE_A_MS = 124_000;
const ATHLETE_B_MS = 112_000;
const MISLEADING_FINISH_MS = 999_000;

const leadThenCaughtA: PaceCheckpoint[] = [
  { distanceM: 0, elapsedMs: 0 },
  { distanceM: 400, elapsedMs: 50_000 },
  { distanceM: 800, elapsedMs: 130_000 },
];

const leadThenCaughtB: PaceCheckpoint[] = [
  { distanceM: 0, elapsedMs: 0 },
  { distanceM: 400, elapsedMs: 70_000 },
  { distanceM: 800, elapsedMs: 120_000 },
];

function twoAthleteConfig(): RaceConfiguration {
  return {
    distanceM: EIGHT_HUNDRED_M,
    athletes: [
      { id: "A", name: "Marcelo", finishTimeMs: ATHLETE_A_MS },
      { id: "B", name: "Josh", finishTimeMs: ATHLETE_B_MS },
    ],
  };
}

describe("Test gate B", () => {
  it("RaceEngine works with ConstantPaceModel", () => {
    const engine = new RaceEngine(twoAthleteConfig(), [
      new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS),
      new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_B_MS),
    ]);

    const mid = engine.telemetryAt(ATHLETE_B_MS);
    expect(mid.athletes[0]?.distanceCoveredM).toBeCloseTo(722.5806, 4);
    expect(mid.athletes[1]?.distanceCoveredM).toBe(EIGHT_HUNDRED_M);
    expect(mid.athletes[1]?.finished).toBe(true);
    expect(mid.athletes[0]?.finished).toBe(false);
    expect(mid.status).toBe("running");

    const result = engine.result();
    expect(result.winnerId).toBe("B");
    expect(result.timeGapMs).toBe(12_000);
    expect(result.distanceGapAtWinnerFinishM).toBeCloseTo(77.4194, 4);
  });

  it("RaceEngine works with a non-linear mock PaceModel", () => {
    const paceA = new NonlinearPaceModel(leadThenCaughtA, MISLEADING_FINISH_MS);
    const paceB = new NonlinearPaceModel(leadThenCaughtB, MISLEADING_FINISH_MS);
    const engine = new RaceEngine(twoAthleteConfig(), [paceA, paceB]);

    const at50s = engine.telemetryAt(50_000);
    expect(at50s.athletes[0]?.distanceCoveredM).toBeCloseTo(400, 6);
    expect(at50s.athletes[1]?.distanceCoveredM).toBeCloseTo((50_000 / 70_000) * 400, 6);
  });

  it("winner and finish logic are determined through PaceModel.distanceAt", () => {
    const paceA = new NonlinearPaceModel(leadThenCaughtA, MISLEADING_FINISH_MS);
    const paceB = new NonlinearPaceModel(leadThenCaughtB, MISLEADING_FINISH_MS);

    expect(paceA.finishTimeMs).toBe(MISLEADING_FINISH_MS);
    expect(firstFinishTimeMs(paceA)).toBe(130_000);
    expect(firstFinishTimeMs(paceB)).toBe(120_000);

    const engine = new RaceEngine(twoAthleteConfig(), [paceA, paceB]);
    const result = engine.result();

    expect(result.winnerId).toBe("B");
    expect(result.winningTimeMs).toBe(120_000);
    expect(result.timeGapMs).toBe(10_000);
    expect(result.snapshot.athletes[0]?.distanceM).toBeCloseTo(paceA.distanceAt(120_000), 8);
    expect(result.snapshot.athletes[1]?.distanceM).toBe(EIGHT_HUNDRED_M);
  });

  it("RaceEngine does not assume constant velocity", () => {
    const source = readFileSync(resolve("src/domain/race/RaceEngine.ts"), "utf8");
    expect(source).not.toContain("ConstantPaceModel");
    expect(source).not.toMatch(/averageSpeed|speed\s*\*\s*elapsed|finishTimeMs\s*\*/);

    const paceA = new NonlinearPaceModel(leadThenCaughtA, MISLEADING_FINISH_MS);
    const paceB = new NonlinearPaceModel(leadThenCaughtB, MISLEADING_FINISH_MS);
    const engine = new RaceEngine(twoAthleteConfig(), [paceA, paceB]);

    for (const elapsedMs of [0, 25_000, 50_000, 90_000, 110_000, 120_000, 130_000]) {
      const telemetry = engine.telemetryAt(elapsedMs);
      expect(telemetry.athletes[0]?.distanceCoveredM).toBeCloseTo(paceA.distanceAt(elapsedMs), 8);
      expect(telemetry.athletes[1]?.distanceCoveredM).toBeCloseTo(paceB.distanceAt(elapsedMs), 8);
    }
  });

  it("a mocked athlete can lead early and be caught later", () => {
    const paceA = new NonlinearPaceModel(leadThenCaughtA, MISLEADING_FINISH_MS);
    const paceB = new NonlinearPaceModel(leadThenCaughtB, MISLEADING_FINISH_MS);
    const engine = new RaceEngine(twoAthleteConfig(), [paceA, paceB]);

    const early = engine.telemetryAt(50_000);
    expect(early.athletes[0]?.distanceCoveredM).toBeGreaterThan(
      early.athletes[1]?.distanceCoveredM ?? 0,
    );

    const late = engine.telemetryAt(110_000);
    expect(late.athletes[1]?.distanceCoveredM).toBeGreaterThan(
      late.athletes[0]?.distanceCoveredM ?? 0,
    );

    expect(engine.result().winnerId).toBe("B");
  });
});
