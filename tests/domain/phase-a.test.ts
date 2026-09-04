import { describe, expect, it } from "vitest";
import {
  CANONICAL_LAP_M,
  ConstantPaceModel,
  METRES_PER_MILE,
  PHASE1_ATHLETE_COUNT,
  RACE_DISTANCES,
  completedLaps,
  currentLapProgress,
  parseRaceTime,
  raceProgress,
  raceResultFromPaceModels,
  requireTwoAthletes,
  totalLaps,
} from "@/domain/race";
import type { AthletePaceBinding, PaceModel } from "@/domain/race";

function twoAthletes(first: PaceModel, second: PaceModel): AthletePaceBinding[] {
  return [
    { id: "A", pace: first },
    { id: "B", pace: second },
  ];
}

const EIGHT_HUNDRED_M = 800;
const ATHLETE_A_MS = 124_000;
const ATHLETE_B_MS = 112_000;

describe("Test gate A", () => {
  it("1. parse 52.34", () => {
    expect(parseRaceTime("52.34")).toEqual({ ok: true, milliseconds: 52_340 });
  });

  it("2. parse 1:52.00", () => {
    expect(parseRaceTime("1:52.00")).toEqual({ ok: true, milliseconds: 112_000 });
  });

  it("3. parse 2:04.00", () => {
    expect(parseRaceTime("2:04.00")).toEqual({ ok: true, milliseconds: 124_000 });
  });

  it("4. reject invalid input", () => {
    expect(parseRaceTime("")).toEqual({ ok: false, error: "blank" });
    expect(parseRaceTime("   ")).toEqual({ ok: false, error: "blank" });
    expect(parseRaceTime("0")).toEqual({ ok: false, error: "zero" });
    expect(parseRaceTime("0:00.00")).toEqual({ ok: false, error: "zero" });
    expect(parseRaceTime("-1.00")).toEqual({ ok: false, error: "negative" });
    expect(parseRaceTime("1::52")).toEqual({ ok: false, error: "malformed" });
    expect(parseRaceTime("1:60.00")).toEqual({ ok: false, error: "seconds_out_of_range" });
    expect(parseRaceTime("abc")).toEqual({ ok: false, error: "non_numeric" });
    expect(parseRaceTime("4:15.35")).toEqual({ ok: true, milliseconds: 255_350 });
    expect(parseRaceTime("12:43.56")).toEqual({ ok: true, milliseconds: 763_560 });
  });

  it("5. 800m / 124s average speed", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS);
    expect(pace.speedAt()).toBeCloseTo(6.4516129, 7);
  });

  it("6. 800m / 112s average speed", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_B_MS);
    expect(pace.speedAt()).toBeCloseTo(7.1428571, 7);
  });

  it("7. distance at t=0", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS);
    expect(pace.distanceAt(0)).toBe(0);
    expect(pace.distanceAt(-1_000)).toBe(0);
  });

  it("8. distance halfway through race", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS);
    expect(pace.distanceAt(ATHLETE_A_MS / 2)).toBeCloseTo(400, 7);
  });

  it("9. distance clamps at finish", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS);
    expect(pace.distanceAt(ATHLETE_A_MS)).toBe(EIGHT_HUNDRED_M);
    expect(pace.distanceAt(ATHLETE_A_MS + 60_000)).toBe(EIGHT_HUNDRED_M);
  });

  it("10. athlete does not exceed race distance", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_B_MS);
    expect(pace.distanceAt(ATHLETE_B_MS * 10)).toBeLessThanOrEqual(EIGHT_HUNDRED_M);
  });

  it("11. 400m lap calculation", () => {
    expect(completedLaps(400)).toBe(1);
    expect(currentLapProgress(400)).toBe(0);
    expect(totalLaps(400)).toBe(1);
    expect(CANONICAL_LAP_M).toBe(400);
  });

  it("12. 800m lap calculation", () => {
    expect(completedLaps(800)).toBe(2);
    expect(totalLaps(800)).toBe(2);
  });

  it("13. 1500m fractional lap", () => {
    expect(completedLaps(1500)).toBe(3);
    expect(currentLapProgress(1500)).toBeCloseTo(0.75, 10);
    expect(totalLaps(1500)).toBeCloseTo(3.75, 10);
  });

  it("14. 3000m fractional lap", () => {
    expect(completedLaps(3000)).toBe(7);
    expect(currentLapProgress(3000)).toBeCloseTo(0.5, 10);
    expect(totalLaps(3000)).toBeCloseTo(7.5, 10);
  });

  it("15. 5000m fractional lap", () => {
    expect(completedLaps(5000)).toBe(12);
    expect(currentLapProgress(5000)).toBeCloseTo(0.5, 10);
    expect(totalLaps(5000)).toBeCloseTo(12.5, 10);
  });

  it("16. 12-second result gap fixture", () => {
    const result = raceResultFromPaceModels(
      twoAthletes(
        new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS),
        new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_B_MS),
      ),
    );

    expect(result.winnerId).toBe("B");
    expect(result.isTie).toBe(false);
    expect(result.timeGapMs).toBe(12_000);
    expect(result.winningTimeMs).toBe(ATHLETE_B_MS);
  });

  it("17. ~77.419m distance-gap fixture", () => {
    const paceA = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS);
    const paceB = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_B_MS);
    const result = raceResultFromPaceModels(twoAthletes(paceA, paceB));

    expect(paceA.distanceAt(ATHLETE_B_MS)).toBeCloseTo(722.5806, 4);
    expect(result.distanceGapAtWinnerFinishM).toBeCloseTo(77.4194, 4);
    expect(result.snapshot.athletes[0]?.distanceM).toBeCloseTo(722.5806, 4);
    expect(result.snapshot.athletes[1]?.distanceM).toBe(EIGHT_HUNDRED_M);
  });

  it("18. tie race", () => {
    const result = raceResultFromPaceModels(
      twoAthletes(
        new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS),
        new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS),
      ),
    );

    expect(result.winnerId).toBeNull();
    expect(result.isTie).toBe(true);
    expect(result.timeGapMs).toBe(0);
    expect(result.distanceGapAtWinnerFinishM).toBe(0);
    expect(result.snapshot.winnerId).toBeNull();
    expect(result.snapshot.leadM).toBe(0);
  });

  it("19. Mile distance works with generic model", () => {
    const mile = RACE_DISTANCES.find((distance) => distance.id === "mile");
    expect(mile?.distanceM).toBe(METRES_PER_MILE);

    const finishTimeMs = 240_000;
    const pace = new ConstantPaceModel(METRES_PER_MILE, finishTimeMs);
    expect(pace.distanceAt(finishTimeMs / 2)).toBeCloseTo(METRES_PER_MILE / 2, 7);
    expect(pace.distanceAt(finishTimeMs)).toBe(METRES_PER_MILE);
    expect(RACE_DISTANCES.map((distance) => distance.id)).toEqual([
      "100",
      "200",
      "400",
      "600",
      "800",
      "1000",
      "1500",
      "mile",
      "3000",
      "5000",
    ]);
  });

  it("20. progress remains in [0, 1]", () => {
    const pace = new ConstantPaceModel(EIGHT_HUNDRED_M, ATHLETE_A_MS);

    expect(raceProgress(pace.distanceAt(-5_000), EIGHT_HUNDRED_M)).toBe(0);
    expect(raceProgress(pace.distanceAt(0), EIGHT_HUNDRED_M)).toBe(0);
    expect(raceProgress(pace.distanceAt(ATHLETE_A_MS / 2), EIGHT_HUNDRED_M)).toBe(0.5);
    expect(raceProgress(pace.distanceAt(ATHLETE_A_MS), EIGHT_HUNDRED_M)).toBe(1);
    expect(raceProgress(pace.distanceAt(ATHLETE_A_MS * 3), EIGHT_HUNDRED_M)).toBe(1);
    expect(raceProgress(EIGHT_HUNDRED_M + 50, EIGHT_HUNDRED_M)).toBe(1);
  });

  it("enforces exactly two athletes", () => {
    expect(PHASE1_ATHLETE_COUNT).toBe(2);
    expect(requireTwoAthletes([{ id: "A" }])).toEqual({
      ok: false,
      error: "expected_two_athletes",
    });
    expect(
      requireTwoAthletes([{ id: "A" }, { id: "B" }, { id: "C" }]),
    ).toEqual({ ok: false, error: "expected_two_athletes" });
    expect(requireTwoAthletes([{ id: "A" }, { id: "B" }])).toEqual({
      ok: true,
      athletes: [{ id: "A" }, { id: "B" }],
    });
  });
});
