import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
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
    queued,
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
    fire(nextNow: number): void {
      act(() => {
        now = nextNow;
        const frame = queued.shift();
        if (!frame) {
          throw new Error("Expected a scheduled race frame");
        }
        frame(now);
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

describe("master race clock display", () => {
  it("shows 10.00 after a 10.00 / 10.00 race overshoots by 0.01s", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "10.00", "10.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    clock.advance(9_990);
    clock.fire(10_010);

    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("10.00");
    expect(screen.getByTestId("result-athlete-A")).toHaveTextContent("Marcelo 10.00");
    expect(screen.getByTestId("result-athlete-B")).toHaveTextContent("Josh 10.00");
  });

  it("shows 10.50 after a 10.00 / 10.50 race overshoots by 0.01s", async () => {
    const { clock, user } = await renderWorkspace();
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "10.00", "10.50");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    clock.advance(10_000);
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("10.00");
    expect(screen.getByTestId("athlete-finished-time-A")).toHaveTextContent("Finished 10.00");
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();

    clock.advance(490);
    clock.fire(10_510);

    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("10.50");
    expect(screen.getByTestId("result-athlete-A")).toHaveTextContent("Marcelo 10.00");
    expect(screen.getByTestId("result-athlete-B")).toHaveTextContent("Josh 10.50");
    expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 10.00");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("0.50 seconds faster");
  });
});
