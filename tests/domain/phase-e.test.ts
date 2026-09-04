import { describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  MAX_FRAME_DELTA_MS,
  RaceClock,
  RaceEngine,
  RaceSimulation,
} from "@/domain/race";
import type { RaceConfiguration } from "@/domain/race";
import { createRaceLoop } from "@/runtime/createRaceLoop";

const DISTANCE_M = 800;
const FINISH_A_MS = 124_000;
const FINISH_B_MS = 112_000;

function simulation(): RaceSimulation {
  const config: RaceConfiguration = {
    distanceM: DISTANCE_M,
    athletes: [
      { id: "A", name: "Marcelo", finishTimeMs: FINISH_A_MS },
      { id: "B", name: "Josh", finishTimeMs: FINISH_B_MS },
    ],
  };
  return new RaceSimulation(
    new RaceEngine(config, [
      new ConstantPaceModel(DISTANCE_M, FINISH_A_MS),
      new ConstantPaceModel(DISTANCE_M, FINISH_B_MS),
    ]),
    new RaceClock(),
  );
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

describe("Test gate E", () => {
  it("initial state is idle", () => {
    const race = simulation();
    expect(race.telemetry().status).toBe("idle");
    expect(race.telemetry().raceTimeMs).toBe(0);
  });

  it("start -> running", () => {
    const race = simulation();
    expect(race.start(0).status).toBe("running");
    expect(race.telemetry().raceTimeMs).toBe(0);
  });

  it("elapsed time advances", () => {
    const race = simulation();
    race.start(1_000);
    expect(advance(race, 1_000, 250)).toBe(1_250);
    expect(race.telemetry().raceTimeMs).toBe(250);
  });

  it("both athletes use identical raceTime", () => {
    const race = simulation();
    race.start(0);
    advance(race, 0, 8_000);
    const telemetry = race.telemetry();
    expect(telemetry.athletes[0]?.distanceCoveredM).not.toBe(
      telemetry.athletes[1]?.distanceCoveredM,
    );
    expect(telemetry.raceTimeMs).toBe(8_000);
    const paceA = new ConstantPaceModel(DISTANCE_M, FINISH_A_MS);
    const paceB = new ConstantPaceModel(DISTANCE_M, FINISH_B_MS);
    expect(telemetry.athletes[0]?.distanceCoveredM).toBeCloseTo(paceA.distanceAt(8_000), 8);
    expect(telemetry.athletes[1]?.distanceCoveredM).toBeCloseTo(paceB.distanceAt(8_000), 8);
  });

  it("pause freezes elapsed time", () => {
    const race = simulation();
    race.start(0);
    const wallMs = advance(race, 0, 4_000);
    race.pause();
    expect(race.telemetry().status).toBe("paused");
    expect(race.telemetry().raceTimeMs).toBe(4_000);
    race.tick(wallMs + 20_000);
    expect(race.telemetry().raceTimeMs).toBe(4_000);
  });

  it("resume does not count paused duration", () => {
    const race = simulation();
    race.start(0);
    advance(race, 0, 3_000);
    race.pause();
    race.resume(50_000);
    advance(race, 50_000, 1_000);
    expect(race.telemetry().raceTimeMs).toBe(4_000);
    expect(race.telemetry().status).toBe("running");
  });

  it("reset returns elapsed to zero from running, paused, and after finish", () => {
    const running = simulation();
    running.start(0);
    advance(running, 0, 5_000);
    expect(running.reset().raceTimeMs).toBe(0);
    expect(running.telemetry().status).toBe("idle");

    const paused = simulation();
    paused.start(0);
    advance(paused, 0, 5_000);
    paused.pause();
    expect(paused.reset().raceTimeMs).toBe(0);

    const finished = simulation();
    finished.start(0);
    advance(finished, 0, FINISH_A_MS);
    expect(finished.telemetry().status).toBe("finished");
    expect(finished.reset().status).toBe("idle");
    expect(finished.telemetry().raceTimeMs).toBe(0);
    expect(finished.telemetry().athletes.every((athlete) => athlete.distanceCoveredM === 0)).toBe(
      true,
    );
  });

  it("repeated pause/resume does not drift", () => {
    const race = simulation();
    race.start(0);
    let wallMs = 0;
    for (let step = 0; step < 20; step += 1) {
      wallMs = advance(race, wallMs, 500);
      race.pause();
      wallMs += 10_000;
      race.resume(wallMs);
    }
    expect(race.telemetry().raceTimeMs).toBe(10_000);
  });

  it("10 updates vs 1,000 updates produce the same distance for the same race time", () => {
    const coarse = simulation();
    coarse.start(0);
    for (let step = 1; step <= 10; step += 1) {
      coarse.tick(step * 100);
    }

    const fine = simulation();
    fine.start(0);
    for (let step = 1; step <= 1_000; step += 1) {
      fine.tick(step);
    }

    expect(coarse.telemetry().raceTimeMs).toBe(1_000);
    expect(fine.telemetry().raceTimeMs).toBe(1_000);
    expect(coarse.telemetry().athletes[0]?.distanceCoveredM).toBe(
      fine.telemetry().athletes[0]?.distanceCoveredM,
    );
    expect(coarse.telemetry().athletes[1]?.distanceCoveredM).toBe(
      fine.telemetry().athletes[1]?.distanceCoveredM,
    );
  });

  it("background/large delta cannot corrupt result", () => {
    const race = simulation();
    race.start(0);
    advance(race, 0, 1_000);
    race.tick(31_000);
    expect(race.telemetry().raceTimeMs).toBe(1_000 + MAX_FRAME_DELTA_MS);

    const paceA = new ConstantPaceModel(DISTANCE_M, FINISH_A_MS);
    expect(race.telemetry().athletes[0]?.distanceCoveredM).toBeCloseTo(
      paceA.distanceAt(1_000 + MAX_FRAME_DELTA_MS),
      8,
    );
    expect(race.telemetry().athletes[0]?.distanceCoveredM).toBeLessThan(DISTANCE_M);
  });

  it("clock cannot become negative", () => {
    const clock = new RaceClock();
    clock.start(10_000);
    clock.tick(1_000);
    expect(clock.getElapsedMs()).toBe(0);

    const race = simulation();
    race.start(5_000);
    race.tick(4_000);
    expect(race.telemetry().raceTimeMs).toBe(0);
  });

  it("hidden document pauses a running race", () => {
    const race = simulation();
    let now = 0;
    const queued: Array<(time: number) => void> = [];
    const loop = createRaceLoop(race, () => undefined, {
      now: () => now,
      requestFrame: (callback) => {
        queued.push(callback);
        return queued.length;
      },
      cancelFrame: () => {
        queued.length = 0;
      },
    });

    loop.start();
    now = 100;
    queued.shift()?.(now);
    expect(race.telemetry().status).toBe("running");
    expect(race.telemetry().raceTimeMs).toBe(100);
    loop.handleVisibility("hidden");
    expect(race.telemetry().status).toBe("paused");
    expect(race.telemetry().raceTimeMs).toBe(100);
  });
});
