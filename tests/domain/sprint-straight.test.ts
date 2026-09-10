import { describe, expect, it } from "vitest";
import {
  courseForRace,
  courseTypeForRace,
  hypot,
  sprintStraight,
  stadiumTrack,
} from "@/domain/track";

describe("100m sprint-straight course", () => {
  it("uses the sprint course only for 100m", () => {
    expect(courseTypeForRace(100)).toBe("sprint-straight");
    expect(courseTypeForRace(200)).toBe("stadium-oval");
    expect(courseTypeForRace(800)).toBe("stadium-oval");
    expect(courseForRace(100)).toBe(sprintStraight);
    expect(courseForRace(800)).toBe(stadiumTrack);
  });

  it("places the finish on the oval finish and the start 100m back on the home straight", () => {
    const finish = stadiumTrack.sampleAtDistanceAroundLap(0);
    const sprintFinish = sprintStraight.sampleForRace(100, 100);
    const sprintStart = sprintStraight.sampleForRace(100, 0);

    expect(sprintFinish.position.x).toBeCloseTo(finish.position.x, 10);
    expect(sprintFinish.position.y).toBeCloseTo(finish.position.y, 10);
    expect(hypot({
      x: finish.position.x - sprintStart.position.x,
      y: finish.position.y - sprintStart.position.y,
    })).toBeCloseTo(100, 8);
    expect(sprintStart.position.x).toBeLessThan(finish.position.x);
    expect(sprintStart.position.y).toBeCloseTo(finish.position.y, 8);
  });
});
