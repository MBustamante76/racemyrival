import { describe, expect, it } from "vitest";
import {
  COMPARISON_ADJACENT_LANE,
  COMPARISON_INNER_LANE,
  SPRINT_STRAIGHT_M,
  createLaneModel,
  createRaceCourse,
  dot,
  homeStraightLeftTangentX,
  hypot,
  sprintStraight,
  stadiumTrack,
} from "@/domain/track";

const lanes = createLaneModel("comparison");

function expectUnit(vector: { x: number; y: number }) {
  expect(hypot(vector)).toBeCloseTo(1, 10);
}

describe("sprint straight geometry", () => {
  it("has a logical length of exactly 100m", () => {
    expect(sprintStraight.lapLengthM).toBe(100);
    expect(SPRINT_STRAIGHT_M).toBe(100);
    expect(createRaceCourse(100).lengthM).toBe(100);
  });

  it("places 0m on the straight extension, not on the oval 300m station", () => {
    const start = sprintStraight.sampleAtDistance(0);
    const oval300 = stadiumTrack.sampleAtDistanceAroundLap(300);
    const finish = stadiumTrack.sampleAtDistanceAroundLap(0);

    expect(start.position.x).toBeLessThan(homeStraightLeftTangentX());
    expect(start.position.y).toBeCloseTo(finish.position.y, 10);
    expect(start.position.x).not.toBeCloseTo(oval300.position.x, 8);
    expect(start.position.y).not.toBeCloseTo(oval300.position.y, 8);
    expect(oval300.position.y).not.toBeCloseTo(finish.position.y, 8);
  });

  it("places 100m on the existing oval finish line", () => {
    const sprintFinish = sprintStraight.sampleAtDistance(100);
    const ovalFinish = stadiumTrack.sampleAtDistanceAroundLap(0);

    expect(sprintFinish.position.x).toBeCloseTo(ovalFinish.position.x, 10);
    expect(sprintFinish.position.y).toBeCloseTo(ovalFinish.position.y, 10);
    expect(sprintFinish.tangent.x).toBeCloseTo(ovalFinish.tangent.x, 10);
    expect(sprintFinish.tangent.y).toBeCloseTo(ovalFinish.tangent.y, 10);
  });

  it("is 100m from logical start to finish in course space", () => {
    const start = sprintStraight.sampleAtDistance(0);
    const finish = sprintStraight.sampleAtDistance(100);
    expect(hypot({
      x: finish.position.x - start.position.x,
      y: finish.position.y - start.position.y,
    })).toBeCloseTo(100, 10);
  });

  it("keeps a constant tangent and a perpendicular normal along the chute", () => {
    const samples = [0, 25, 50, 75, 100].map((distanceM) => sprintStraight.sampleAtDistance(distanceM));
    const tangent = samples[0]?.tangent;
    const normal = samples[0]?.normal;

    for (const sample of samples) {
      expect(sample.tangent.x).toBeCloseTo(tangent?.x ?? Number.NaN, 10);
      expect(sample.tangent.y).toBeCloseTo(tangent?.y ?? Number.NaN, 10);
      expect(sample.normal.x).toBeCloseTo(normal?.x ?? Number.NaN, 10);
      expect(sample.normal.y).toBeCloseTo(normal?.y ?? Number.NaN, 10);
      expectUnit(sample.tangent);
      expectUnit(sample.normal);
      expect(dot(sample.tangent, sample.normal)).toBeCloseTo(0, 10);
    }
  });

  it("separates comparison lanes without changing course distance", () => {
    const sample = sprintStraight.sampleAtDistance(50);
    const inner = lanes.visualPosition(sample, COMPARISON_INNER_LANE);
    const adjacent = lanes.visualPosition(sample, COMPARISON_ADJACENT_LANE);

    expect(hypot({ x: inner.x - adjacent.x, y: inner.y - adjacent.y })).toBeCloseTo(4, 10);
    expect(inner).not.toEqual(adjacent);
    expect(sample.distanceAroundLapM).toBe(50);
    expect(sprintStraight.sampleAtDistance(50).distanceAroundLapM).toBe(50);
  });
});
