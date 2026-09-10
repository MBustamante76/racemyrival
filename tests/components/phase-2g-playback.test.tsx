import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import type { PlaybackRate } from "@/domain/race";
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
    queued,
    resetNow(): void {
      now = 0;
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

const RATES: PlaybackRate[] = [1, 2, 4, 8];

describe("Phase 2G playback fixture", () => {
  it("keeps the 800m fixture identical at 1x, 2x, 4x, and 8x", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    for (const rate of RATES) {
      if (screen.queryByRole("button", { name: "Reset" })) {
        await user.click(screen.getByRole("button", { name: "Reset" }));
        clock.resetNow();
      }

      await user.click(screen.getByTestId(`playback-speed-${rate}x`));
      await user.click(screen.getByRole("button", { name: "Start race" }));
      clock.advance(Math.ceil(124_000 / rate / 100) * 100);

      expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
      expect(screen.getByTestId("result-winning-time")).toHaveTextContent("Winning time 1:52.00");
      expect(screen.getByTestId("result-time-gap")).toHaveTextContent("12.00 seconds faster");
      expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
        77.4194,
        4,
      );
      expect(screen.getByTestId("result-athlete-A")).toHaveTextContent("Marcelo 2:04.00");
      expect(screen.getByTestId("result-athlete-B")).toHaveTextContent("Josh 1:52.00");
    }

    expect(screen.getByTestId("playback-speed-8x")).toBeInTheDocument();
  });
});
