import { describe, expect, it } from "vitest";
import { formatLapLabel } from "@/components/lapLabel";

describe("lap label", () => {
  it("uses LAP X OF Y for exact 400m multiples", () => {
    expect(formatLapLabel(800, 0, 0)).toBe("LAP 1 OF 2");
    expect(formatLapLabel(800, 1, 0.5)).toBe("LAP 2 OF 2");
    expect(formatLapLabel(400, 0, 0.25)).toBe("LAP 1 OF 1");
  });

  it("uses progress percent when the race is not a whole number of laps", () => {
    expect(formatLapLabel(1500, 0, 0.2)).toBe("LAP 1 · 20%");
    expect(formatLapLabel(100, 0, 0)).toBe("LAP 1 · 0%");
  });
});
