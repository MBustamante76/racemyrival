import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_LAYOUT_MQ } from "@/components/desktopLayout";
import {
  LANDSCAPE_FIT_SHORT_EDGE_MAX,
  LANDSCAPE_ORIENTATION_MQ,
  LANDSCAPE_RACE_ATTR,
} from "@/components/landscapeFit";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { setFinishingTimes } from "../helpers/finishing-time";

function mockPhoneLandscape(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const matches =
        query === LANDSCAPE_ORIENTATION_MQ
          ? true
          : query === DESKTOP_LAYOUT_MQ
            ? false
            : query === "(prefers-reduced-motion: reduce)"
              ? false
              : false;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
  Object.defineProperty(window.screen, "width", {
    configurable: true,
    value: 844,
  });
  Object.defineProperty(window.screen, "height", {
    configurable: true,
    value: 390,
  });
  expect(Math.min(window.screen.width, window.screen.height)).toBeLessThanOrEqual(
    LANDSCAPE_FIT_SHORT_EDGE_MAX,
  );
}

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

describe("landscape race hero mode", () => {
  beforeEach(() => {
    mockPhoneLandscape();
    document.documentElement.removeAttribute(LANDSCAPE_RACE_ATTR);
  });

  afterEach(() => {
    document.documentElement.removeAttribute(LANDSCAPE_RACE_ATTR);
    vi.restoreAllMocks();
  });

  it("keeps chrome visible and controls below the track while idle in phone landscape", () => {
    render(<RaceWorkspace />);
    expect(document.documentElement.hasAttribute(LANDSCAPE_RACE_ATTR)).toBe(false);
    expect(screen.getByTestId("track-stage-shell")).toHaveAttribute("data-race-hero", "false");
    expect(screen.queryByTestId("track-controls")).not.toBeInTheDocument();
  });

  it("grows the track, docks controls beside it, and marks race-hero chrome while running", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    await setFinishingTimes(user, "0:14.00", "0:10.00");
    await user.click(screen.getByTestId("setup-sheet-tab"));
    await user.click(screen.getByTestId("setup-sheet-start"));
    clock.advance(200);

    expect(document.documentElement.getAttribute(LANDSCAPE_RACE_ATTR)).toBe("true");
    expect(screen.getByTestId("track-stage-shell")).toHaveAttribute("data-race-hero", "true");
    expect(screen.getByTestId("track-controls")).toHaveAttribute("data-controls-placement", "beside");
    expect(screen.getByTestId("race-controls")).toHaveAttribute("data-layout", "stack");
    expect(screen.getByTestId("playback-speed")).toHaveAttribute("data-layout", "stack");
    expect(screen.getByTestId("track-stage").className).toContain("100svh-0.75rem");
  });
});
