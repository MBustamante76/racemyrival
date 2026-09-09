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

function expectSetupCardControls(): void {
  const card = screen.getByTestId("setup-card");
  expect(card).toBeInTheDocument();
  expect(screen.getByLabelText("Race distance")).toBeInTheDocument();
  expect(screen.getByText("YOU")).toBeInTheDocument();
  expect(screen.getByText("RIVAL")).toBeInTheDocument();
  expect(screen.getByLabelText("Athlete A minutes")).toBeInTheDocument();
  expect(screen.getByLabelText("Athlete A seconds")).toBeInTheDocument();
  expect(screen.getByLabelText("Athlete A hundredths")).toBeInTheDocument();
  expect(screen.getByLabelText("Athlete B minutes")).toBeInTheDocument();
  expect(screen.getByLabelText("Athlete B seconds")).toBeInTheDocument();
  expect(screen.getByLabelText("Athlete B hundredths")).toBeInTheDocument();
  expect(screen.getByTestId("playback-speed")).toBeInTheDocument();
  expect(card.contains(screen.getByLabelText("Race distance"))).toBe(true);
  expect(card.contains(screen.getByTestId("setup-athlete-A"))).toBe(true);
  expect(card.contains(screen.getByTestId("setup-athlete-B"))).toBe(true);
}

describe("Phase 2C setup card", () => {
  it("keeps split times and actions on the desktop horizontal card", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    render(<RaceWorkspace />);
    expectSetupCardControls();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
    expect(screen.getByTestId("setup-card").className).toContain("md:grid-cols-");
  });

  it("keeps the same Phase 1 controls on a mobile-width shell", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<RaceWorkspace />);
    expectSetupCardControls();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
    expect(screen.getByTestId("setup-athlete-A")).toBeInTheDocument();
    expect(screen.getByTestId("setup-athlete-B")).toBeInTheDocument();
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("grid-cols-2");
  });

  it("locks the form while running and exposes Pause and Reset", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(screen.getByLabelText("Race distance")).toBeDisabled();
    expect(screen.getByLabelText("Athlete A minutes")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByTestId("playback-speed-4x")).toBeEnabled();
  });
});
