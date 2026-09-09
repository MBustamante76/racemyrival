import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";

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
    get queuedCount() {
      return queued.length;
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

async function finishFixture(user: ReturnType<typeof userEvent.setup>, clock: ReturnType<typeof createFakeLoopClock>) {
  await user.click(screen.getByRole("button", { name: "Start race" }));
  clock.advance(124_000);
}

describe("Phase 2H replay and race again", () => {
  it("replays the same 800m fixture with the form still locked", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await finishFixture(user, clock);

    expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
    const firstLead = Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"));

    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByLabelText("Athlete A minutes")).toBeDisabled();
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    expect(clock.queuedCount).toBe(1);

    clock.advance(124_000);
    expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
    expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
      firstLead,
      8,
    );
    expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
      77.4194,
      4,
    );
  });

  it("unlocks the form on Race again and does not stack replay frames", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await finishFixture(user, clock);

    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(clock.queuedCount).toBe(1);
    clock.advance(124_000);
    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(clock.queuedCount).toBe(1);

    clock.advance(124_000);
    await user.click(screen.getByRole("button", { name: "Race again" }));

    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Athlete A minutes")).toBeEnabled();
    expect(screen.getByLabelText("Race distance")).toBeEnabled();
    expect(clock.queuedCount).toBe(0);
  });
});
