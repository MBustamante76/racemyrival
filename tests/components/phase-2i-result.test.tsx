import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultPanel } from "@/components/ResultPanel";
import { ConstantPaceModel, raceResultFromPaceModels } from "@/domain/race";

const fixtureAthletes = [
  { id: "A", name: "Marcelo", finishTimeMs: 124_000 },
  { id: "B", name: "Josh", finishTimeMs: 112_000 },
] as const;

const fixtureResult = raceResultFromPaceModels([
  { id: "A", pace: new ConstantPaceModel(800, 124_000) },
  { id: "B", pace: new ConstantPaceModel(800, 112_000) },
]);

describe("Phase 2I result card", () => {
  it("keeps the fixture numbers and uses name-based gap copy", () => {
    render(<ResultPanel result={fixtureResult} athletes={fixtureAthletes} />);

    expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
    expect(screen.getByTestId("result-times-vs")).toHaveTextContent("1:52.00 VS 2:04.00");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("12.00 seconds faster");
    expect(screen.getByTestId("result-distance-gap")).toHaveTextContent(
      "Josh was approximately 77 metres ahead when they crossed the finish line",
    );
    expect(screen.getByTestId("result-trophy")).toBeInTheDocument();
    expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
      77.4194,
      4,
    );
  });
});
