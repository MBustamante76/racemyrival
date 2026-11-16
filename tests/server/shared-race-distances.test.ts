import { afterEach, describe, expect, it } from "vitest";
import { MAX_FRAME_DELTA_MS, RACE_DISTANCES } from "@/domain/race";
import type { RaceSimulation } from "@/domain/race";
import {
  clearMemorySharedRaceStore,
  createSharedRace,
  sharedRaceToFormDraft,
} from "@/server/sharedRace";
import { createConfiguredRace, parseRaceForm } from "@/components/raceSession";

afterEach(() => {
  clearMemorySharedRaceStore();
});

function advance(race: RaceSimulation, fromWallMs: number, addElapsedMs: number): void {
  let wallMs = fromWallMs;
  let remainingMs = addElapsedMs;
  while (remainingMs > 0) {
    const stepMs = Math.min(MAX_FRAME_DELTA_MS, remainingMs);
    wallMs += stepMs;
    remainingMs -= stepMs;
    race.tick(wallMs);
  }
}

describe("shared race across distances", () => {
  it.each(RACE_DISTANCES.map((d) => [d.id, d.distanceM, d.label] as const))(
    "replays %s with the same winner",
    async (distanceId, distanceM) => {
      // Keep times on 10ms boundaries so hundredths round-trip cleanly.
      const finishA = Math.max(8_000, Math.round((distanceM * 40) / 10) * 10);
      const finishB = finishA + 2_000;
      const race = await createSharedRace({
        distanceId,
        distanceM,
        competitorA: { displayName: "A-Runner", finishTimeMs: finishA },
        competitorB: { displayName: "B-Runner", finishTimeMs: finishB },
      });
      const parsed = parseRaceForm(sharedRaceToFormDraft(race));
      expect(parsed).not.toBeNull();
      const simulation = createConfiguredRace(parsed!);
      simulation.start(0);
      advance(simulation, 0, finishB + 1_000);
      expect(simulation.telemetry().result?.winnerId).toBe("A");
      expect(simulation.telemetry().result?.winningTimeMs).toBe(finishA);
    },
  );
});
