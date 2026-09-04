import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ConstantPaceModel, RaceEngine } from "@/domain/race";
import type { RaceConfiguration } from "@/domain/race";
import {
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  COMPARISON_LANE_SEPARATION_M,
  STANDARD_LANE_WIDTH_M,
  createLaneModel,
  hypot,
  stadiumTrack,
} from "@/domain/track";

const lanes = createLaneModel("comparison");

function config(finishAMs: number, finishBMs: number): RaceConfiguration {
  return {
    distanceM: 800,
    athletes: [
      { id: "A", name: "Marcelo", finishTimeMs: finishAMs },
      { id: "B", name: "Josh", finishTimeMs: finishBMs },
    ],
  };
}

describe("Test gate D", () => {
  it("visual offset changes rendered position", () => {
    const sample = stadiumTrack.sampleAtDistanceAroundLap(0);
    const inner = lanes.visualPosition(sample, COMPARISON_INNER_LANE);
    const adjacent = lanes.visualPosition(sample, COMPARISON_ADJACENT_LANE);

    expect(hypot({ x: adjacent.x - inner.x, y: adjacent.y - inner.y })).toBeCloseTo(
      COMPARISON_LANE_SEPARATION_M,
      10,
    );
    expect(COMPARISON_INNER_LANE.widthM).toBe(STANDARD_LANE_WIDTH_M);
    expect(inner.y).not.toBeCloseTo(adjacent.y, 8);
  });

  it("visual offset does not change race distance", () => {
    const coveredM = 322.5;
    const sample = stadiumTrack.sampleForRace(800, coveredM);
    const inner = lanes.visualPosition(sample, COMPARISON_INNER_LANE);
    const adjacent = lanes.visualPosition(sample, COMPARISON_ADJACENT_LANE);

    expect(sample.distanceAroundLapM).toBeCloseTo((0 + coveredM) % 400, 10);
    expect(inner).not.toEqual(adjacent);
    expect(sample.distanceAroundLapM).toBeCloseTo((0 + coveredM) % 400, 10);
  });

  it("identical times sit side-by-side rather than overlapping", () => {
    const sample = stadiumTrack.sampleForRace(800, 400);
    const assignments = lanes.assign(["A", "B"]);
    const first = lanes.visualPosition(sample, assignments[0].lane);
    const second = lanes.visualPosition(sample, assignments[1].lane);

    expect(hypot({ x: first.x - second.x, y: first.y - second.y })).toBeCloseTo(
      COMPARISON_LANE_SEPARATION_M,
      10,
    );
  });

  it("both athletes still finish at the same logical race distance", () => {
    const finishA = stadiumTrack.sampleForRace(800, 800);
    const finishB = stadiumTrack.sampleForRace(800, 800);
    expect(finishA.distanceAroundLapM).toBe(0);
    expect(finishB.distanceAroundLapM).toBe(0);

    const engine = new RaceEngine(config(124_000, 124_000), [
      new ConstantPaceModel(800, 124_000),
      new ConstantPaceModel(800, 124_000),
    ]);
    const telemetry = engine.telemetryAt(124_000);
    expect(telemetry.athletes[0]?.distanceCoveredM).toBe(800);
    expect(telemetry.athletes[1]?.distanceCoveredM).toBe(800);
  });

  it("lane assignment is deterministic and not speed-based", () => {
    const first = lanes.assign(["A", "B"]);
    const again = lanes.assign(["A", "B"]);
    const reversed = lanes.assign(["B", "A"]);

    expect(first).toEqual(again);
    expect(first[0]).toEqual({ athleteId: "A", lane: COMPARISON_INNER_LANE });
    expect(first[1]).toEqual({ athleteId: "B", lane: COMPARISON_ADJACENT_LANE });
    expect(reversed[0]).toEqual({ athleteId: "B", lane: COMPARISON_INNER_LANE });
    expect(reversed[1]).toEqual({ athleteId: "A", lane: COMPARISON_ADJACENT_LANE });

    const fasterSecond = lanes.assign(["slow", "fast"]);
    expect(fasterSecond[0]?.lane.laneNumber).toBe(1);
    expect(fasterSecond[1]?.lane.laneNumber).toBe(2);
  });

  it("TrackSample normal offsets correctly on straights", () => {
    const homeStraight = stadiumTrack.sampleAtDistanceAroundLap(350);
    expect(homeStraight.normal.x).toBeCloseTo(0, 8);
    expect(homeStraight.normal.y).toBeCloseTo(1, 8);

    const inner = lanes.visualPosition(homeStraight, COMPARISON_INNER_LANE);
    const outer = lanes.visualPosition(homeStraight, COMPARISON_ADJACENT_LANE);
    expect(outer.y).toBeCloseTo(inner.y - COMPARISON_LANE_SEPARATION_M, 10);
    expect(outer.x).toBeCloseTo(inner.x, 10);

    const backStraight = stadiumTrack.sampleAtDistanceAroundLap(160);
    expect(backStraight.normal.y).toBeCloseTo(-1, 8);
    const backOuter = lanes.visualPosition(backStraight, COMPARISON_ADJACENT_LANE);
    expect(backOuter.y).toBeCloseTo(backStraight.position.y + COMPARISON_LANE_SEPARATION_M, 10);
  });

  it("TrackSample normal offsets correctly on bends", () => {
    const bend = stadiumTrack.sampleAtDistanceAroundLap(50);
    const inner = lanes.visualPosition(bend, COMPARISON_INNER_LANE);
    const outer = lanes.visualPosition(bend, COMPARISON_ADJACENT_LANE);
    const outward = {
      x: outer.x - inner.x,
      y: outer.y - inner.y,
    };

    expect(hypot(outward)).toBeCloseTo(COMPARISON_LANE_SEPARATION_M, 10);
    expect(outward.x / COMPARISON_LANE_SEPARATION_M).toBeCloseTo(-bend.normal.x, 8);
    expect(outward.y / COMPARISON_LANE_SEPARATION_M).toBeCloseTo(-bend.normal.y, 8);

    const engineSource = readFileSync(resolve("src/domain/race/RaceEngine.ts"), "utf8");
    expect(engineSource).not.toContain("LaneModel");
    expect(engineSource).not.toContain("visualOffset");
  });
});
