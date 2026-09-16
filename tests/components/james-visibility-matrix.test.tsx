import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { setFinishingTimes } from "../helpers/finishing-time";

function createFakeLoopClock() {
  let now = 0;
  const queued: Array<(time: number) => void> = [];

  return {
    dependencies: {
      now: () => now,
      requestFrame: (callback) => {
        queued.push(callback);
        return queued.length;
      },
      cancelFrame: () => {
        queued.length = 0;
      },
    } satisfies RaceLoopDependencies,
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

describe("James visibility matrix", () => {
  it("shows track above setup on idle, without telemetry or result", () => {
    const { container } = render(<RaceWorkspace />);
    expect(screen.getByTestId("track-stage")).toBeInTheDocument();
    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.queryByTestId("telemetry-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
    expect(container.innerHTML.indexOf('data-testid="track-stage"')).toBeLessThan(
      container.innerHTML.indexOf('data-testid="setup-card"'),
    );
  });

  it("shows track only while running or paused, with live race controls", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(screen.getByTestId("track-stage")).toBeInTheDocument();
    expect(screen.queryByTestId("setup-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("telemetry-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("race-controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByTestId("race-status")).toHaveTextContent("paused");
    expect(screen.queryByTestId("setup-card")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  it("shows track plus result when finished, with Reset available", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "1.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(1_000);

    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");
    expect(screen.getByTestId("track-stage")).toBeInTheDocument();
    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("setup-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("telemetry-strip")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });
});
