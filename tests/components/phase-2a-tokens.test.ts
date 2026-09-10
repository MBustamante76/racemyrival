import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { athleteColors, colors } from "@/styles/tokens";

describe("Phase 2A design tokens", () => {
  it("exposes the mockup palette for athletes, brand, track, and infield", () => {
    expect(colors.brandNavy).toBe("#0F182F");
    expect(colors.brandRed).toBe("#E10A1F");
    expect(colors.athleteA).toBe("#0470FC");
    expect(colors.athleteB).toBe("#FB5A03");
    expect(colors.track).toBe("#E15B56");
    expect(colors.infield).toBe("#C9D2A1");
    expect(athleteColors.A).toBe(colors.athleteA);
    expect(athleteColors.B).toBe(colors.athleteB);
    expect(colors.track).not.toBe(colors.brandRed);
  });

  it("maps the same tokens into CSS variables and Inter/Montserrat fonts", () => {
    const css = readFileSync(resolve("src/app/globals.css"), "utf8");
    const layout = readFileSync(resolve("src/app/layout.tsx"), "utf8");

    expect(css).toContain("--rmr-navy: #0f182f");
    expect(css).toContain("--rmr-red: #e10a1f");
    expect(css).toContain("--rmr-athlete-a: #0470fc");
    expect(css).toContain("--rmr-athlete-b: #fb5a03");
    expect(css).toContain("--rmr-track: #e15b56");
    expect(css).toContain("--rmr-infield: #c9d2a1");
    expect(css).toContain("font-variant-numeric: tabular-nums");
    expect(layout).toContain("Montserrat");
    expect(layout).toContain("Inter");
    expect(layout).not.toContain("Geist");
  });
});
