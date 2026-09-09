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

describe("Phase 2F telemetry strip UI", () => {
  it("keeps displayed metres inside the race and freezes across pause", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(1_000);

    expect(screen.getByTestId("athlete-distance-A")).toHaveTextContent("200.0m");
    expect(screen.getByTestId("athlete-distance-B")).toHaveTextContent("200.0m");
    expect(screen.getByTestId("telemetry-gap")).toHaveTextContent("0.0m");

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByTestId("athlete-distance-A")).toHaveTextContent("200.0m");
    await user.click(screen.getByRole("button", { name: "Resume" }));
    clock.advance(1_000);
    expect(screen.getByTestId("athlete-distance-A")).toHaveTextContent("400.0m");
  });
});
