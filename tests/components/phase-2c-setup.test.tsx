import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { setFinishingTimes } from "../helpers/finishing-time";
import { mockLayoutMedia } from "../helpers/match-media";

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
  expect(within(card).getByRole("heading", { name: "Race setup" })).toBeInTheDocument();
  expect(screen.getByLabelText("Select race distance")).toBeInTheDocument();
  expect(screen.getByText("You")).toBeInTheDocument();
  expect(screen.getByText("Rival")).toBeInTheDocument();
  expect(screen.getByLabelText("Enter your time minutes")).toBeInTheDocument();
  expect(screen.getByLabelText("Enter your time seconds")).toBeInTheDocument();
  expect(screen.getByLabelText("Enter your time hundredths")).toBeInTheDocument();
  expect(screen.getByLabelText("Enter rival's time minutes")).toBeInTheDocument();
  expect(screen.getByLabelText("Enter rival's time seconds")).toBeInTheDocument();
  expect(screen.getByLabelText("Enter rival's time hundredths")).toBeInTheDocument();
  expect(screen.queryByTestId("playback-speed")).not.toBeInTheDocument();
  expect(screen.queryByTestId("race-controls")).not.toBeInTheDocument();
  expect(card.contains(screen.getByLabelText("Select race distance"))).toBe(true);
  expect(card.contains(screen.getByTestId("setup-athlete-A"))).toBe(true);
  expect(card.contains(screen.getByTestId("setup-athlete-B"))).toBe(true);
  expect(within(card).queryByText(/YN|YR/)).not.toBeInTheDocument();
}

describe("Phase 2C setup card", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("puts distance on top and Start under the form on desktop with no speed yet", () => {
    mockLayoutMedia({ desktop: true });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    render(<RaceWorkspace />);
    expectSetupCardControls();
    const card = screen.getByTestId("setup-card");
    const start = screen.getByRole("button", { name: "Start race" });
    expect(start).toBeEnabled();
    expect(card.contains(start)).toBe(true);
    expect(card.className).not.toContain("lg:grid-cols-");
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("sm:grid-cols-2");
  });

  it("keeps the same Phase 1 controls on a mobile-width shell with Start under setup", () => {
    mockLayoutMedia({ desktop: false });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<RaceWorkspace />);
    expectSetupCardControls();
    const start = screen.getByRole("button", { name: "Start race" });
    expect(start).toBeEnabled();
    expect(screen.getByTestId("setup-card").contains(start)).toBe(true);
    expect(screen.getByTestId("setup-athlete-A")).toBeInTheDocument();
    expect(screen.getByTestId("setup-athlete-B")).toBeInTheDocument();
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("grid-cols-1");
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("sm:grid-cols-2");
  });

  it("stacks finishing times under the athlete identity row", () => {
    mockLayoutMedia({ desktop: false });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<RaceWorkspace />);
    expectSetupCardControls();
    expect(screen.getByTestId("setup-athlete-A").className).toContain("flex-col");
    expect(screen.getByTestId("setup-athlete-B").className).toContain("flex-col");
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("grid-cols-1");
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("sm:grid-cols-2");
    expect(within(screen.getByTestId("setup-athlete-A")).getByText("MIN")).toBeInTheDocument();
    expect(within(screen.getByTestId("setup-athlete-B")).getByText("MIN")).toBeInTheDocument();
    expect(screen.getAllByText("SEC")).toHaveLength(2);
    expect(screen.getAllByText("HUNDREDTHS")).toHaveLength(2);
  });

  it("hides setup while running and shows speed with Pause and Reset", async () => {
    mockLayoutMedia({ desktop: false });
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await setFinishingTimes(user, "2.00", "2.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(screen.queryByTestId("setup-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("telemetry-strip")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByTestId("playback-speed")).toBeInTheDocument();
    expect(screen.getByTestId("playback-speed-5x")).toBeEnabled();
  });
});
