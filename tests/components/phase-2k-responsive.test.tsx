import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
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

describe("Phase 2K viewport and injected journey", () => {
  it("keeps primary actions at 44px and does not scale the page", () => {
    for (const width of [375, 390, 430, 768, 1280, 1440]) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      const { unmount } = render(<Home />);
      expect(screen.getByRole("button", { name: "Start race" }).className).toContain("min-h-11");
      expect(screen.getByTestId("playback-speed-1x").className).toContain("min-h-11");
      expect(screen.getByTestId("setup-card")).toBeInTheDocument();
      expect(screen.getByTestId("track-stage")).toBeInTheDocument();
      unmount();
    }

    const page = readFileSync(resolve("src/app/page.tsx"), "utf8");
    const workspace = readFileSync(resolve("src/components/RaceWorkspace.tsx"), "utf8");
    expect(`${page}\n${workspace}`).not.toContain("scale(");
  });

  it("runs an injected-time 800m journey through pause, 4x, finish, and replay", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(2_000);
    expect(screen.getByTestId("race-clock")).toHaveTextContent("2.00");

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByTestId("race-status")).toHaveTextContent("paused");
    expect(screen.getByTestId("race-clock")).toHaveTextContent("2.00");

    await user.click(screen.getByRole("button", { name: "Resume" }));
    await user.click(screen.getByTestId("playback-speed-4x"));
    clock.advance(30_500);

    expect(screen.getByTestId("result-winner")).toHaveTextContent("Josh wins");
    expect(screen.getByTestId("result-time-gap")).toHaveTextContent("12.00 seconds faster");
    expect(Number(screen.getByTestId("result-panel").getAttribute("data-snapshot-lead-m"))).toBeCloseTo(
      77.4194,
      4,
    );

    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    expect(screen.getByLabelText("Athlete A minutes")).toBeDisabled();
  });
});
