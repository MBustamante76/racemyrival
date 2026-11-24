import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { timePartsFromMilliseconds } from "@/components/raceSession";
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

const sharedDraft = {
  distanceId: "800",
  athletes: [
    { id: "A", name: "Dad", time: timePartsFromMilliseconds(120_000) },
    { id: "B", name: "Kid", time: timePartsFromMilliseconds(110_000) },
  ] as [
    { id: string; name: string; time: ReturnType<typeof timePartsFromMilliseconds> },
    { id: string; name: string; time: ReturnType<typeof timePartsFromMilliseconds> },
  ],
};

describe("Reset after finish matches Create New Race", () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal("location", { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unlocks a blank setup when Reset is pressed after a local race finishes", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    await setFinishingTimes(user, "2:00.00", "1:50.00");
    await user.type(screen.getByLabelText("Enter your name"), "Alex");
    await user.type(screen.getByLabelText("Enter rival's name"), "Sam");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(120_000);

    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryByTestId("result-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.getByLabelText("Enter your name")).toHaveValue("");
    expect(screen.getByLabelText("Enter rival's name")).toHaveValue("");
    expect(screen.getByLabelText("Enter your time minutes")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Start race" })).toBeInTheDocument();
  });

  it("does not soft-reset into a locked dead end on a shared race after finish", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(
      <RaceWorkspace
        loopDependencies={clock.dependencies}
        shared={{ raceId: "abcdefghijklmnopqrstu", draft: sharedDraft, autoStart: true }}
      />,
    );

    // Shared watch auto-starts on a macrotask; flush it before advancing frames.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    clock.advance(120_000);
    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(assign).toHaveBeenCalledWith("/");
  });

  it("still soft-resets mid-race so runners can reconfigure without leaving", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    await setFinishingTimes(user, "2:00.00", "2:00.00");
    await user.type(screen.getByLabelText("Enter your name"), "Alex");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.getByLabelText("Enter your name")).toHaveValue("Alex");
  });
});
