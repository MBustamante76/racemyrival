import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { setFinishingTimes } from "../helpers/finishing-time";

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
    queued,
    get now() {
      return now;
    },
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

function markerDistance(id: string): number {
  const group = document.querySelector(`[data-athlete-id="${id}"]`);
  return Number(group?.getAttribute("data-distance-covered-m"));
}

describe("Test gate H", () => {
  it("enables start when the form is valid", async () => {
    await renderWorkspace();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
  });

  it("prevents start and shows an error for an invalid time", async () => {
    const { user } = await renderWorkspace();
    const minutes = screen.getByLabelText("Athlete A minutes");
    const seconds = screen.getByLabelText("Athlete A seconds");
    const hundredths = screen.getByLabelText("Athlete A hundredths");
    await user.clear(minutes);
    await user.type(minutes, "0");
    await user.clear(seconds);
    await user.type(seconds, "0");
    await user.clear(hundredths);
    await user.type(hundredths, "0");

    expect(screen.getByRole("alert")).toHaveTextContent("Time must be greater than zero");
    expect(screen.getByRole("button", { name: "Start race" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Start race" }));
    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.00");
    expect(markerDistance("A")).toBe(0);
    expect(markerDistance("B")).toBe(0);
  });

  it("start launches both athletes", async () => {
    const { clock, user } = await renderWorkspace();
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    clock.advance(1_000);

    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.00");
    expect(markerDistance("A")).toBeCloseTo(400, 5);
    expect(markerDistance("B")).toBeCloseTo(400, 5);
  });

  it("pause freezes the displayed clock and positions", async () => {
    const { clock, user } = await renderWorkspace();
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);
    const pausedDistance = markerDistance("A");

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByTestId("race-status")).toHaveTextContent("paused");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.50");
    expect(clock.queued).toHaveLength(0);

    act(() => {
      clock.dependencies.now();
    });
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.50");
    expect(markerDistance("A")).toBe(pausedDistance);
    expect(markerDistance("B")).toBe(pausedDistance);
  });

  it("resume continues the race", async () => {
    const { clock, user } = await renderWorkspace();
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);
    await user.click(screen.getByRole("button", { name: "Pause" }));
    await user.click(screen.getByRole("button", { name: "Resume" }));

    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    clock.advance(500);
    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.00");
    expect(markerDistance("A")).toBeCloseTo(400, 5);
  });

  it("reset clears state and permits a new configuration", async () => {
    const { clock, user } = await renderWorkspace();
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(200);
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.00");
    expect(markerDistance("A")).toBe(0);
    expect(screen.getByLabelText("Race distance")).toBeEnabled();
    expect(screen.getByLabelText("Athlete A minutes")).toBeEnabled();

    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "1.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);
    expect(markerDistance("A")).toBeCloseTo(200, 5);
  });

  it("distance selection affects calculations", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(1_000);

    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toHaveAttribute(
      "data-race-distance-m",
      "400",
    );
    expect(markerDistance("A")).toBeCloseTo(200, 5);
    expect(markerDistance("B")).toBeCloseTo(200, 5);
  });

  it("shows finishing time when a runner finishes and does not stop the slower athlete", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);

    expect(screen.getByTestId("athlete-finished-time-B")).toHaveTextContent("Finished 0.50");
    expect(screen.queryByTestId("athlete-finished-time-A")).not.toBeInTheDocument();
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    expect(markerDistance("B")).toBe(400);
    const afterFirst = markerDistance("A");
    expect(afterFirst).toBeCloseTo(200, 5);

    clock.advance(200);
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.70");
    expect(markerDistance("B")).toBe(400);
    expect(markerDistance("A")).toBeGreaterThan(afterFirst);
    expect(screen.queryByTestId("athlete-finished-time-A")).not.toBeInTheDocument();
  });
});
