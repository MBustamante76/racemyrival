import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMES_BY_DISTANCE_MS,
  defaultTimesForDistance,
  timePartsFromMilliseconds,
} from "@/components/raceSession";
import { RACE_DISTANCES } from "@/domain/race";

describe("per-distance default finishing times", () => {
  it("covers every race distance option", () => {
    for (const distance of RACE_DISTANCES) {
      expect(DEFAULT_TIMES_BY_DISTANCE_MS[distance.id]).toBeDefined();
    }
  });

  it("matches the agreed Me / Rival defaults", () => {
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["100"]).toEqual([14_000, 10_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["200"]).toEqual([28_000, 20_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["400"]).toEqual([62_000, 45_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["600"]).toEqual([100_000, 80_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["800"]).toEqual([140_000, 105_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["1000"]).toEqual([185_000, 150_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["1500"]).toEqual([285_000, 210_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS.mile).toEqual([310_000, 239_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["3000"]).toEqual([630_000, 510_000]);
    expect(DEFAULT_TIMES_BY_DISTANCE_MS["5000"]).toEqual([1_170_000, 960_000]);

    expect(defaultTimesForDistance("800")).toEqual([
      timePartsFromMilliseconds(140_000),
      timePartsFromMilliseconds(105_000),
    ]);
  });
});
