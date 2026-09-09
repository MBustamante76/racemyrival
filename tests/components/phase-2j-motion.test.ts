import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase 2J motion", () => {
  it("scopes transitions to UI chrome and disables them under reduced motion", () => {
    const css = readFileSync(resolve("src/app/globals.css"), "utf8");
    const renderer = readFileSync(resolve("src/components/TrackRenderer.tsx"), "utf8");

    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".ui-transition");
    expect(css).toContain(".result-reveal");
    expect(css).not.toContain("* {");
    expect(renderer).not.toContain("animation:");
    expect(renderer).not.toContain("transition-duration");
  });
});
