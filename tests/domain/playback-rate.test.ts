import { describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  MAX_FRAME_DELTA_MS,
  RaceClock,
  RaceEngine,
  RaceSimulation,
} from "@/domain/race";
import type { RaceConfiguration } from "@/domain/race";

function simulation(finishAMs = 10_000, finishBMs = 10_500): RaceSimulation {
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

describe("playback speed", () => {
  it("accelerates visual time at 4x without changing finish maths", () => {
    const race = simulation(10_000, 10_500);
    race.setPlaybackRate(4);
    race.start(0);
    advance(race, 0, 250);

    expect(race.telemetry().raceTimeMs).toBe(1_000);
    expect(race.telemetry().athletes[0]?.finishTimeMs).toBe(10_000);
    expect(race.telemetry().athletes[1]?.finishTimeMs).toBe(10_500);
    expect(race.telemetry().result).toBeNull();
  });

  it("can change rate during the race", () => {
    const race = simulation();
    race.start(0);
    advance(race, 0, 1_000);
    expect(race.telemetry().raceTimeMs).toBe(1_000);

    race.setPlaybackRate(4);
    advance(race, 1_000, 250);
    expect(race.telemetry().raceTimeMs).toBe(2_000);

    race.setPlaybackRate(1);
    advance(race, 1_250, 500);
    expect(race.telemetry().raceTimeMs).toBe(2_500);
  });

  it("keeps results and the clamped clock on the real finish times at 8x", () => {
    const race = simulation(10_000, 10_500);
    race.setPlaybackRate(8);
    race.start(0);
    advance(race, 0, 1_320);

    expect(race.telemetry().status).toBe("finished");
    expect(race.telemetry().raceTimeMs).toBe(10_500);
    expect(race.telemetry().result?.winningTimeMs).toBe(10_000);
    expect(race.telemetry().result?.timeGapMs).toBe(500);
    expect(race.telemetry().athletes[0]?.finishTimeMs).toBe(10_000);
    expect(race.telemetry().athletes[1]?.finishTimeMs).toBe(10_500);
  });
});
