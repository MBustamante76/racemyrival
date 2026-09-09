import { describe, expect, it } from "vitest";
import { displayDistanceM, telemetryStripView } from "@/components/telemetryView";
import { ConstantPaceModel, deriveAthleteState } from "@/domain/race";
import type { AthleteInput, AthleteRaceState } from "@/domain/race";

function athleteState(input: AthleteInput, distanceM: number, elapsedMs: number): AthleteRaceState {
  return deriveAthleteState(input, new ConstantPaceModel(distanceM, input.finishTimeMs), elapsedMs);
}

describe("Phase 2F telemetry view", () => {
  it("clamps displayed distance to the race distance", () => {
    expect(displayDistanceM(820, 800)).toBe(800);
    expect(displayDistanceM(-4, 800)).toBe(0);
  });

  it("uses the 800m fixture snapshot gap after the first finish", () => {
    const marcelo = { id: "A", name: "Marcelo", finishTimeMs: 124_000 };
    const josh = { id: "B", name: "Josh", finishTimeMs: 112_000 };
    const atJoshFinish = [
      athleteState(marcelo, 800, 112_000),
      athleteState(josh, 800, 112_000),
    ];
    const snapshot = {
      raceTimeMs: 112_000,
      leadM: 77.41935483870964,
      winnerId: "B",
      athletes: [
        { id: "A", distanceM: atJoshFinish[0].distanceCoveredM },
        { id: "B", distanceM: 800 },
      ],
    };
    const view = telemetryStripView(800, atJoshFinish, snapshot);

    expect(view.displayLeadM).toBeCloseTo(77.4194, 4);
    expect(view.athletes[0].distanceM).toBeLessThanOrEqual(800);
    expect(view.athletes[1].distanceM).toBe(800);
    expect(view.leaderId).toBe("B");
    expect(view.leaderName).toBe("Josh");
    expect(view.isTie).toBe(false);

    const bothFinished = [
      athleteState(marcelo, 800, 124_000),
      athleteState(josh, 800, 124_000),
    ];
    const afterBoth = telemetryStripView(800, bothFinished, snapshot);
    expect(afterBoth.displayLeadM).toBeCloseTo(77.4194, 4);
    expect(afterBoth.leaderName).toBe("Josh");
    expect(afterBoth.isTie).toBe(false);
  });

  it("shows a 0m gap for a tie", () => {
    const athletes = [
      athleteState({ id: "A", name: "Marcelo", finishTimeMs: 112_000 }, 800, 60_000),
      athleteState({ id: "B", name: "Josh", finishTimeMs: 112_000 }, 800, 60_000),
    ];
    const view = telemetryStripView(800, athletes, null);
    expect(view.displayLeadM).toBe(0);
    expect(view.isTie).toBe(true);
    expect(view.leaderId).toBeNull();
  });
});
