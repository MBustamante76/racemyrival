import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase 2O docs", () => {
  it("describes V1, Vercel, and keeps the Phase 1 report", () => {
    const readme = readFileSync(resolve("README.md"), "utf8");
    const phase2 = readFileSync(resolve("PHASE_2_TEST_REPORT.md"), "utf8");
    const phase1 = readFileSync(resolve("PROTOTYPE_TEST_REPORT.md"), "utf8");

    expect(readme).toContain("What V1 is");
    expect(readme).toContain("What V1 is not");
    expect(readme).toContain("Vercel");
    expect(readme).toContain("77.419");
    expect(readme).toContain("PHASE_2_TEST_REPORT.md");
    expect(phase2).toContain("77.4194");
    expect(phase2).toContain("Playwright");
    expect(phase1).toContain("PHASE_2_TEST_REPORT.md");
    expect(phase1).toContain("Phase 1 prototype test report");
  });
});
