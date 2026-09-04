import { describe, expect, it } from "vitest";
import { METRES_PER_MILE, RACE_DISTANCES } from "@/domain/race";
import {
  CANONICAL_LAP_M,
  STADIUM_BEND_M,
  STADIUM_STRAIGHT_M,
  STADIUM_TWO_BENDS_M,
  StadiumTrackGeometry,
  distanceAroundTrackM,
  dot,
  hypot,
  startOffsetM,
} from "@/domain/track";
import type { TrackSample } from "@/domain/race";

const track = new StadiumTrackGeometry();

function expectUnit(vector: { x: number; y: number }) {
  expect(hypot(vector)).toBeCloseTo(1, 10);
}

function expectOrthogonal(a: { x: number; y: number }, b: { x: number; y: number }) {
  expect(dot(a, b)).toBeCloseTo(0, 10);
}

function expectFinishLine(sample: TrackSample) {
  const finish = track.sampleAtDistanceAroundLap(0);
  expect(sample.position.x).toBeCloseTo(finish.position.x, 10);
  expect(sample.position.y).toBeCloseTo(finish.position.y, 10);
  expect(sample.tangent.x).toBeCloseTo(finish.tangent.x, 10);
  expect(sample.tangent.y).toBeCloseTo(finish.tangent.y, 10);
}

describe("Test gate C", () => {
  it("canonical track length is exactly 400m", () => {
    expect(track.lapLengthM).toBe(400);
    expect(CANONICAL_LAP_M).toBe(400);
    expect(2 * STADIUM_STRAIGHT_M + STADIUM_TWO_BENDS_M).toBeCloseTo(400, 12);
    expect(2 * STADIUM_BEND_M).toBeCloseTo(STADIUM_TWO_BENDS_M, 12);
  });

  it("samples at 0m, 100m, 200m, 300m, and near 400m", () => {
    const distances = [0, 100, 200, 300, 399.9];
    for (const distanceM of distances) {
      const sample = track.sampleAtDistanceAroundLap(distanceM);
      expect(Number.isFinite(sample.position.x)).toBe(true);
      expect(Number.isFinite(sample.position.y)).toBe(true);
      expect(sample.distanceAroundLapM).toBeCloseTo(distanceM === 400 ? 0 : distanceM, 8);
      expectUnit(sample.tangent);
      expectUnit(sample.normal);
      expectOrthogonal(sample.tangent, sample.normal);
    }

    const at0 = track.sampleAtDistanceAroundLap(0);
    expect(at0.lapProgress).toBe(0);
    expect(at0.position.y).toBeLessThan(0);

    const at200 = track.sampleAtDistanceAroundLap(200);
    expect(at200.position.y).toBeGreaterThan(0);
  });

  it("is continuous from 400m to 0m", () => {
    const finish = track.sampleAtDistanceAroundLap(0);
    const wrapped = track.sampleAtDistanceAroundLap(400);
    expectFinishLine(wrapped);

    const before = track.sampleAtDistanceAroundLap(399.999);
    const after = track.sampleAtDistanceAroundLap(0.001);
    expect(hypot({
      x: before.position.x - finish.position.x,
      y: before.position.y - finish.position.y,
    })).toBeLessThan(0.05);
    expect(hypot({
      x: after.position.x - finish.position.x,
      y: after.position.y - finish.position.y,
    })).toBeLessThan(0.05);
  });

  it("keeps tangent and normal normalised and perpendicular", () => {
    for (const distanceM of [0, 37, 100, 180, 200, 260, 300, 355, 399.5]) {
      const sample = track.sampleAtDistanceAroundLap(distanceM);
      expectUnit(sample.tangent);
      expectUnit(sample.normal);
      expectOrthogonal(sample.tangent, sample.normal);
    }
  });

  it("uses the comparison-mode start offsets", () => {
    expect(startOffsetM(400)).toBe(0);
    expect(startOffsetM(800)).toBe(0);
    expect(startOffsetM(1500)).toBe(100);
    expect(startOffsetM(3000)).toBe(200);
    expect(startOffsetM(5000)).toBe(200);
    expect(startOffsetM(METRES_PER_MILE)).toBeCloseTo(
      (400 - (METRES_PER_MILE % 400)) % 400,
      10,
    );
  });

  it("maps an exact finish to the finish line", () => {
    for (const distanceM of [400, 800, 1500, 3000, 5000, METRES_PER_MILE]) {
      const sample = track.sampleForRace(distanceM, distanceM);
      expectFinishLine(sample);
      expect(sample.distanceAroundLapM).toBe(0);
      expect(distanceAroundTrackM(distanceM, distanceM)).toBe(0);
    }
  });

  it("samples an arbitrary race distance without breaking", () => {
    const raceDistanceM = 2345.67;
    const covered = [0, 1, 111.1, 800, 1600, 2345.67, 3000];
    for (const distanceCoveredM of covered) {
      const sample = track.sampleForRace(raceDistanceM, Math.min(distanceCoveredM, raceDistanceM));
      expect(Number.isFinite(sample.position.x)).toBe(true);
      expect(Number.isFinite(sample.position.y)).toBe(true);
      expectUnit(sample.tangent);
      expectUnit(sample.normal);
    }

    const start = track.sampleForRace(1500, 0);
    expect(start.distanceAroundLapM).toBeCloseTo(100, 10);

    for (const option of RACE_DISTANCES) {
      const sample = track.sampleForRace(option.distanceM, option.distanceM / 2);
      expect(Number.isFinite(sample.position.x)).toBe(true);
    }
  });
});
