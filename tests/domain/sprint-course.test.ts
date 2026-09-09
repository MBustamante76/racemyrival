import { describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  RaceEngine,
  raceResultFromPaceModels,
} from "@/domain/race";
import type { RaceConfiguration } from "@/domain/race";
import {
  courseTypeForRace,
  createRaceCourse,
  startOffsetM,
  stadiumTrack,
} from "@/domain/track";

function engine(distanceM: number, finishAMs: number, finishBMs: number): RaceEngine {
  const config: RaceConfiguration = {
    distanceM,
    athletes: [
      { id: "A", name: "Marcelo", finishTimeMs: finishAMs },
      { id: "B", name: "Josh", finishTimeMs: finishBMs },
    ],
  };
  return new RaceEngine(config, [
    new ConstantPaceModel(distanceM, finishAMs),
    new ConstantPaceModel(distanceM, finishBMs),
  ]);
}

describe("race course selection", () => {
  it("selects the sprint-straight course for 100m and the oval for 400m", () => {
    expect(courseTypeForRace(100)).toBe("sprint-straight");
    expect(createRaceCourse(100).type).toBe("sprint-straight");
    expect(courseTypeForRace(400)).toBe("oval");
    expect(createRaceCourse(400).type).toBe("oval");
  });

  it("leaves 800m, 1500m, and 3000m on the oval with the same start offsets", () => {
    expect(createRaceCourse(800).type).toBe("oval");
    expect(createRaceCourse(1500).type).toBe("oval");
    expect(createRaceCourse(3000).type).toBe("oval");
    expect(createRaceCourse(200).type).toBe("oval");
    expect(startOffsetM(800)).toBe(0);
    expect(startOffsetM(1500)).toBe(100);
    expect(startOffsetM(3000)).toBe(200);

    const oval800 = stadiumTrack.sampleForRace(800, 400);
    const course800 = createRaceCourse(800).sampleAtDistance(400);
    expect(course800.position.x).toBeCloseTo(oval800.position.x, 10);
    expect(course800.position.y).toBeCloseTo(oval800.position.y, 10);

    const oval1500 = stadiumTrack.sampleForRace(1500, 0);
    const course1500 = createRaceCourse(1500).sampleAtDistance(0);
    expect(course1500.distanceAroundLapM).toBeCloseTo(100, 10);
    expect(course1500.position.x).toBeCloseTo(oval1500.position.x, 10);
    expect(course1500.position.y).toBeCloseTo(oval1500.position.y, 10);

    const at400 = createRaceCourse(3000).sampleAtDistance(400);
    const oval400 = stadiumTrack.sampleForRace(3000, 400);
    expect(at400.position.x).toBeCloseTo(oval400.position.x, 10);
    expect(at400.position.y).toBeCloseTo(oval400.position.y, 10);
  });

  it("keeps the 800m 1:52 vs 2:04 gap at ~77.4194m", () => {
    const result = raceResultFromPaceModels([
      { id: "A", pace: new ConstantPaceModel(800, 124_000) },
      { id: "B", pace: new ConstantPaceModel(800, 112_000) },
    ]);
    expect(result.winnerId).toBe("B");
    expect(result.timeGapMs).toBe(12_000);
    expect(result.distanceGapAtWinnerFinishM).toBeCloseTo(77.4194, 4);
    expect(result.snapshot.leadM).toBeCloseTo(77.4194, 4);
  });

  it("maps 100m coverage to the sprint course and pins a finish to the shared line", () => {
    const course = createRaceCourse(100);
    const finish = stadiumTrack.sampleAtDistanceAroundLap(0);

    expect(course.sampleAtDistance(0).lapProgress).toBe(0);
    expect(course.sampleAtDistance(25).distanceAroundLapM).toBe(25);
    expect(course.sampleAtDistance(50).distanceAroundLapM).toBe(50);
    expect(course.sampleAtDistance(75).distanceAroundLapM).toBe(75);

    expect(course.sampleAtDistance(0).distanceAroundLapM).toBe(0);
    const done = course.sampleAtDistance(100);
    expect(done.position.x).toBeCloseTo(finish.position.x, 10);
    expect(done.position.y).toBeCloseTo(finish.position.y, 10);
    expect(done.distanceAroundLapM).toBe(100);

    const telemetry = engine(100, 10_000, 10_500).telemetryAt(10_500);
    expect(telemetry.athletes[0]?.distanceCoveredM).toBe(100);
    expect(telemetry.athletes[1]?.distanceCoveredM).toBe(100);
    expect(telemetry.result?.distanceGapAtWinnerFinishM).toBeCloseTo(4.7619, 3);
  });

  it("does not let lane offset change 100m distance covered", () => {
    const telemetry = engine(100, 10_000, 12_000).telemetryAt(5_000);
    expect(telemetry.athletes[0]?.distanceCoveredM).toBeCloseTo(50, 8);
    expect(telemetry.athletes[1]?.distanceCoveredM).toBeCloseTo(5000 / 12_000 * 100, 8);
    expect(telemetry.athletes[0]?.distanceCoveredM).not.toBe(
      telemetry.athletes[1]?.distanceCoveredM,
    );
  });
});
