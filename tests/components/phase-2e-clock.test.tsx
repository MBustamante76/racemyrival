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

describe("Phase 2E infield clock", () => {
  it("follows injected time with hundredths and resets to 0.00", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    expect(screen.getByTestId("track-stage").contains(screen.getByTestId("race-clock"))).toBe(true);
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.00");
    expect(screen.getByTestId("race-lap")).toHaveTextContent("LAP 1 OF 2");

    await setFinishingTimes(user, "2.00", "2.00");
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(1_230);

    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.23");
    expect(screen.getByTestId("race-lap")).toHaveTextContent("LAP 1 OF 1");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("race-clock")).toHaveTextContent("0.00");
  });

  it("keeps finish times on real race time when playback is 4x", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByTestId("playback-speed-4x"));
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(250);

    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.00");
    expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 0.50");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("0.50 seconds faster");
  });
});
