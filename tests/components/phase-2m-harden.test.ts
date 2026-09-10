import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { formatGapM, formatMetres, formatSpeedMps } from "@/components/telemetryView";

describe("Phase 2M hardening", () => {
  it("never formats NaN into the telemetry strip", () => {
    expect(formatMetres(Number.NaN)).toBe("0m");
    expect(formatSpeedMps(Number.POSITIVE_INFINITY)).toBe("0.00m/s");
    expect(formatGapM(Number.NaN)).toBe("0m");
  });

  it("keeps the clock client-owned and cancels frames on reset", () => {
    const workspace = readFileSync(resolve("src/components/RaceWorkspace.tsx"), "utf8");
    const clock = readFileSync(resolve("src/components/TrackStage.tsx"), "utf8");
    const loop = readFileSync(resolve("src/runtime/createRaceLoop.ts"), "utf8");

    expect(workspace.startsWith('"use client"')).toBe(true);
    expect(clock).toContain("suppressHydrationWarning");
    expect(loop).toContain("cancelFrame");
    expect(workspace).toContain("sessionRef.current?.reset()");
  });
});
