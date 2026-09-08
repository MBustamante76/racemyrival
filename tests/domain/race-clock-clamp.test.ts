import { describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  MAX_FRAME_DELTA_MS,
  RaceClock,
  RaceEngine,
  RaceSimulation,
  formatRaceTime,
} from "@/domain/race";
import type { RaceConfiguration } from "@/domain/race";
import { createRaceLoop } from "@/runtime/createRaceLoop";

function simulation(finishAMs: number, finishBMs: number): RaceSimulation {
  const config: RaceConfiguration = {
    distanceM: 400,
    athletes: [
      { id: "A", name: "Marcelo", finishTimeMs: finishAMs },
      { id: "B", name: "Josh", finishTimeMs: finishBMs },
    ],
  };
  return new RaceSimulation(
    new RaceEngine(config, [
      new ConstantPaceModel(400, finishAMs),
      new ConstantPaceModel(400, finishBMs),
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

describe("master race clock clamp", () => {
  it("clamps a 10.00 / 10.00 race to 10.00 after a 0.01s frame overshoot", () => {
    const race = simulation(10_000, 10_000);
    race.start(0);
    advance(race, 0, 10_010);

    expect(race.telemetry().status).toBe("finished");
    expect(race.telemetry().raceTimeMs).toBe(10_000);
    expect(formatRaceTime(race.telemetry().raceTimeMs)).toBe("10.00");
    expect(race.telemetry().result?.winningTimeMs).toBe(10_000);
    expect(race.telemetry().result?.timeGapMs).toBe(0);
    expect(race.telemetry().athletes.map((athlete) => athlete.finishTimeMs)).toEqual([10_000, 10_000]);
  });

  it("clamps a 10.00 / 10.50 race to the last finish, not 10.51", () => {
    const race = simulation(10_000, 10_500);
    race.start(0);
    advance(race, 0, 10_510);

    expect(race.telemetry().status).toBe("finished");
    expect(race.telemetry().raceTimeMs).toBe(10_500);
    expect(formatRaceTime(race.telemetry().raceTimeMs)).toBe("10.50");
    expect(race.telemetry().result?.winningTimeMs).toBe(10_000);
    expect(race.telemetry().result?.timeGapMs).toBe(500);
    expect(race.telemetry().athletes[0]?.finishTimeMs).toBe(10_000);
    expect(race.telemetry().athletes[1]?.finishTimeMs).toBe(10_500);
  });

  it("keeps advancing after the first finish until the last athlete finishes", () => {
    const race = simulation(10_000, 10_500);
    race.start(0);
    advance(race, 0, 10_000);

    expect(race.telemetry().status).toBe("running");
    expect(race.telemetry().raceTimeMs).toBe(10_000);
    expect(race.telemetry().athletes[0]?.finished).toBe(true);
    expect(race.telemetry().athletes[1]?.finished).toBe(false);

    advance(race, 10_000, 250);
    expect(race.telemetry().status).toBe("running");
    expect(race.telemetry().raceTimeMs).toBe(10_250);
  });

  it("stops the animation loop on the last finish and leaves the clock at that time", () => {
    const race = simulation(10_000, 10_000);
    let now = 0;
    const queued: Array<(time: number) => void> = [];
    const frames: number[] = [];
    const loop = createRaceLoop(
      race,
      (telemetry) => {
        frames.push(telemetry.raceTimeMs);
      },
      {
        now: () => now,
        requestFrame: (callback) => {
          queued.push(callback);
          return queued.length;
        },
        cancelFrame: () => {
          queued.length = 0;
        },
      },
    );

    loop.start();
    while (now < 9_990) {
      now = Math.min(now + MAX_FRAME_DELTA_MS, 9_990);
      queued.shift()?.(now);
    }
    expect(race.telemetry().status).toBe("running");
    expect(queued).toHaveLength(1);

    now = 10_010;
    queued.shift()?.(now);
    expect(race.telemetry().status).toBe("finished");
    expect(race.telemetry().raceTimeMs).toBe(10_000);
    expect(formatRaceTime(race.telemetry().raceTimeMs)).toBe("10.00");
    expect(queued).toHaveLength(0);
    expect(frames.at(-1)).toBe(10_000);
  });
});
