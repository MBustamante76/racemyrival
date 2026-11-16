import { afterEach, describe, expect, it } from "vitest";
import {
  ConstantPaceModel,
  MAX_FRAME_DELTA_MS,
  raceResultFromPaceModels,
} from "@/domain/race";
import type { RaceSimulation } from "@/domain/race";
import {
  clearMemorySharedRaceStore,
  createSharedRace,
  getSharedRace,
  isOpaqueRaceId,
  sharedRaceToFormDraft,
  usingMemorySharedRaceStore,
  validateCreateSharedRaceInput,
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

describe("shared race persistence", () => {
  it("uses the in-memory store when Redis env is absent", () => {
    expect(usingMemorySharedRaceStore()).toBe(true);
  });

  it("creates an opaque non-sequential id and round-trips the race", async () => {
    const race = await createSharedRace({
      distanceId: "800",
      distanceM: 800,
      competitorA: { displayName: "JAVI", finishTimeMs: 144_000 },
      competitorB: { displayName: "JOEY", finishTimeMs: 148_000 },
      campaignId: "run-lab",
    });

    expect(isOpaqueRaceId(race.id)).toBe(true);
    expect(/^\d+$/.test(race.id)).toBe(false);
    expect(race.id).toHaveLength(21);

    const loaded = await getSharedRace(race.id);
    expect(loaded).toEqual(race);
    expect(loaded?.competitorA.finishTimeMs).toBe(144_000);
    expect(loaded?.competitorB.finishTimeMs).toBe(148_000);
  });

  it("reproduces the canonical Javi vs Joey winner via the existing engine", async () => {
    const race = await createSharedRace({
      distanceId: "800",
      distanceM: 800,
      competitorA: { displayName: "JAVI", finishTimeMs: 144_000 },
      competitorB: { displayName: "JOEY", finishTimeMs: 148_000 },
    });
    const draft = sharedRaceToFormDraft(race);
    const parsed = parseRaceForm(draft);
    expect(parsed).not.toBeNull();
    const simulation = createConfiguredRace(parsed!);
    simulation.start(0);
    advance(simulation, 0, 160_000);
    const telemetry = simulation.telemetry();
    expect(telemetry.result?.winnerId).toBe("A");
    expect(telemetry.result?.winningTimeMs).toBe(144_000);

    const expected = raceResultFromPaceModels([
      { id: "A", pace: new ConstantPaceModel(800, 144_000) },
      { id: "B", pace: new ConstantPaceModel(800, 148_000) },
    ]);
    expect(telemetry.result?.winnerId).toBe(expected.winnerId);
    expect(telemetry.result?.timeGapMs).toBe(expected.timeGapMs);
  });

  it("reproduces competitor B winner", async () => {
    const race = await createSharedRace({
      distanceId: "800",
      distanceM: 800,
      competitorA: { displayName: "JAVI", finishTimeMs: 148_000 },
      competitorB: { displayName: "JOEY", finishTimeMs: 144_000 },
    });
    const parsed = parseRaceForm(sharedRaceToFormDraft(race));
    const simulation = createConfiguredRace(parsed!);
    simulation.start(0);
    advance(simulation, 0, 160_000);
    expect(simulation.telemetry().result?.winnerId).toBe("B");
  });

  it("preserves accented names, apostrophes, and hyphens", async () => {
    const validated = validateCreateSharedRaceInput({
      distanceId: "800",
      distanceM: 800,
      competitorA: { displayName: "José", finishTimeMs: 120_000 },
      competitorB: { displayName: "O'NEIL-SMITH", finishTimeMs: 121_000 },
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const race = await createSharedRace(validated.value);
    expect(race.competitorA.displayName).toBe("José");
    expect(race.competitorB.displayName).toBe("O'NEIL-SMITH");
  });

  it("rejects empty names, bad times, and unsupported distances", () => {
    expect(
      validateCreateSharedRaceInput({
        distanceId: "800",
        distanceM: 800,
        competitorA: { displayName: "  ", finishTimeMs: 1000 },
        competitorB: { displayName: "B", finishTimeMs: 1000 },
      }).ok,
    ).toBe(false);

    expect(
      validateCreateSharedRaceInput({
        distanceId: "800",
        distanceM: 800,
        competitorA: { displayName: "A", finishTimeMs: -1 },
        competitorB: { displayName: "B", finishTimeMs: 1000 },
      }).ok,
    ).toBe(false);

    expect(
      validateCreateSharedRaceInput({
        distanceId: "999",
        distanceM: 999,
        competitorA: { displayName: "A", finishTimeMs: 1000 },
        competitorB: { displayName: "B", finishTimeMs: 1000 },
      }).ok,
    ).toBe(false);

    expect(
      validateCreateSharedRaceInput({
        distanceId: "800",
        distanceM: 400,
        competitorA: { displayName: "A", finishTimeMs: 1000 },
        competitorB: { displayName: "B", finishTimeMs: 1000 },
      }).ok,
    ).toBe(false);
  });

  it("strips HTML-like content from names", () => {
    const validated = validateCreateSharedRaceInput({
      distanceId: "100",
      distanceM: 100,
      competitorA: { displayName: "<script>alert(1)</script>Alex", finishTimeMs: 11_000 },
      competitorB: { displayName: "Sam", finishTimeMs: 12_000 },
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.value.competitorA.displayName).not.toContain("<");
    expect(validated.value.competitorA.displayName).toContain("Alex");
  });

  it("returns null for unknown ids", async () => {
    expect(await getSharedRace("abcdefghijklmnopqrstu")).toBeNull();
  });
});
