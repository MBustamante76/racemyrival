import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

describe("desktop spacebar race controls", () => {
  it("starts, pauses, and resumes with Space on desktop widths", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await setFinishingTimes(user, "2.00", "2.00");
    (document.activeElement as HTMLElement | null)?.blur();

    await user.keyboard(" ");
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");

    await user.keyboard(" ");
    expect(screen.getByTestId("race-status")).toHaveTextContent("paused");

    await user.keyboard(" ");
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
  });

  it("does not steal Space while typing in a name field", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const user = userEvent.setup();
    render(<RaceWorkspace />);
    const name = screen.getByLabelText("Enter your name");
    await user.clear(name);
    await user.click(name);
    await user.keyboard("Sam Lee");
    expect(name).toHaveValue("Sam Lee");
    expect(screen.getByTestId("race-status")).toHaveTextContent("idle");
  });
});
