import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { ResultPanel } from "@/components/ResultPanel";
import {
  ConstantPaceModel,
  raceResultFromPaceModels,
} from "@/domain/race";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";

function createFakeLoopClock() {
  let now = 0;
  const queued: Array<(time: number) => void> = [];

  const dependencies: RaceLoopDependencies = {
    now: () => now,
    requestFrame: (callback) => {
      queued.push(callback);
      return queued.length;
    },
    cancelFrame: () => {
      queued.length = 0;
    },
  };

  return {
    dependencies,
    advance(addElapsedMs: number): void {
      act(() => {
        let remainingMs = addElapsedMs;
        while (remainingMs > 0) {
          const stepMs = Math.min(100, remainingMs);
          now += stepMs;
          remainingMs -= stepMs;
          const frame = queued.shift();
          if (!frame) {
            throw new Error("Expected a scheduled race frame");
          }
          frame(now);
        }
      });
    },
  };
}

async function renderWorkspace() {
  const clock = createFakeLoopClock();
  const user = userEvent.setup();
  render(<RaceWorkspace loopDependencies={clock.dependencies} />);
  return { clock, user };
}

async function setFinishingTimes(
  user: ReturnType<typeof userEvent.setup>,
  timeA: string,
  timeB: string,
): Promise<void> {
  const inputA = screen.getByLabelText("Athlete A finishing time");
  const inputB = screen.getByLabelText("Athlete B finishing time");
  await user.clear(inputA);
  await user.type(inputA, timeA);
  await user.clear(inputB);
  await user.type(inputB, timeB);
}

const fixtureAthletes = [
  { id: "A", name: "Marcelo", finishTimeMs: 124_000 },
  { id: "B", name: "Josh", finishTimeMs: 112_000 },
] as const;

const fixtureResult = raceResultFromPaceModels([
  { id: "A", pace: new ConstantPaceModel(800, 124_000) },
  { id: "B", pace: new ConstantPaceModel(800, 112_000) },
]);

describe("Test gate I", () => {
  it("shows the 800m fixture winner, 12.00s gap, and rounded 77m snapshot gap", () => {
    render(<ResultPanel result={fixtureResult} athletes={fixtureAthletes} />);

    expect(screen.getByRole("heading", { name: "Race complete" })).toBeInTheDocument();
    expect(screen.getByTestId("result-athlete-A")).toHaveTextContent("Marcelo 2:04.00");
    expect(screen.getByTestId("result-athlete-B")).toHaveTextContent("Josh 1:52.00");
    expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
    expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 1:52.00");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("12.00 seconds faster");
    expect(screen.getByTestId("result-distance-gap")).toHaveTextContent(
      "Approximately 77 metres ahead when he crossed the finish line",
    );
    expect(screen.getByTestId("result-panel")).toHaveAttribute(
      "data-snapshot-race-time-ms",
      String(fixtureResult.snapshot.raceTimeMs),
    );
    expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
      77.4194,
      4,
    );
    expect(Math.round(fixtureResult.snapshot.leadM)).toBe(77);
  });

  it("shows a dead-heat result for a tie", () => {
    const tied = raceResultFromPaceModels([
      { id: "A", pace: new ConstantPaceModel(800, 112_000) },
      { id: "B", pace: new ConstantPaceModel(800, 112_000) },
    ]);

    render(
      <ResultPanel
        result={tied}
        athletes={[
          { id: "A", name: "Marcelo", finishTimeMs: 112_000 },
          { id: "B", name: "Josh", finishTimeMs: 112_000 },
        ]}
      />,
    );

    expect(screen.getByTestId("result-winner")).toHaveTextContent("Dead heat");
    expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 1:52.00");
    expect(screen.queryByTestId("result-time-gap")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-distance-gap")).not.toBeInTheDocument();
    expect(tied.snapshot.winnerId).toBeNull();
    expect(tied.snapshot.leadM).toBe(0);
  });

  it("does not show the result before both athletes finish", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);

    expect(screen.getByTestId("athlete-finished-time-B")).toBeInTheDocument();
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
  });

  it("uses the frozen winner snapshot after both finish, not live positions", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(1_000);

    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
    expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 0.50");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("0.50 seconds faster");
    expect(screen.getByTestId("result-distance-gap")).toHaveTextContent(
      "Approximately 200 metres ahead when he crossed the finish line",
    );
    expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
      200,
      5,
    );
    expect(
      document.querySelector("[data-athlete-id='A']")?.getAttribute("data-distance-covered-m"),
    ).toBe("400");
    expect(
      document.querySelector("[data-athlete-id='B']")?.getAttribute("data-distance-covered-m"),
    ).toBe("400");
  });

  it("removes the previous result on reset", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(1_000);
    expect(screen.getByTestId("result-panel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
  });

  it("does not recalculate the result in the panel", () => {
    const source = readFileSync(resolve("src/components/ResultPanel.tsx"), "utf8");
    expect(source).not.toContain("averageSpeed");
    expect(source).not.toContain("distanceAt");
    expect(source).not.toContain("firstFinishTimeMs");
    expect(source).not.toContain("RaceEngine");
    expect(source).not.toContain("timeGapMs(");
    expect(source).not.toContain("currentLeadM");
  });
});
