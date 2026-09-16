import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { scrollTrackIntoView } from "@/components/RaceFx";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { setFinishingTimes } from "../helpers/finishing-time";

vi.mock("@/components/finishConfettiBurst", () => ({
  fireFinishConfetti: vi.fn(async () => undefined),
}));

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

describe("James scroll and bookend FX", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls the track into view on Start", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    const stage = screen.getByTestId("track-stage");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
    expect(stage).toBeInTheDocument();
  });

  it("uses auto scroll behavior when reduced motion is preferred", () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, "matchMedia", { writable: true, value: matchMedia });
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    scrollTrackIntoView(el);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("flashes on start and confetti on finish", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const clock = createFakeLoopClock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "1.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(screen.getByTestId("race-start-flash")).toBeInTheDocument();

    clock.advance(1_000);
    expect(screen.getByTestId("race-status")).toHaveTextContent("finished");
    expect(screen.getByTestId("race-finish-confetti")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
