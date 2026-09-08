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

describe("playback speed controls", () => {
  it("defaults to 1x and can switch to 4x before start", async () => {
    const { clock, user } = await renderWorkspace();
    expect(screen.getByTestId("playback-speed-1x")).toHaveAttribute("aria-checked", "true");

    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByTestId("playback-speed-4x"));
    expect(screen.getByTestId("playback-speed-4x")).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(250);
    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.00");
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
  });

  it("can drop from 4x to 1x during the race", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByTestId("playback-speed-4x"));
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(250);
    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.00");

    await user.click(screen.getByTestId("playback-speed-1x"));
    clock.advance(500);
    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.50");
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
  });

  it("leaves finishing times and the result on real race time at 8x", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByTestId("playback-speed-8x"));
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(130);

    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("1.00");
    expect(screen.getByTestId("result-athlete-A")).toHaveTextContent("Marcelo 1.00");
    expect(screen.getByTestId("result-athlete-B")).toHaveTextContent("Josh 0.50");
    expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 0.50");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("0.50 seconds faster");
  });
});
