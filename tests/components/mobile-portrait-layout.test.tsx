import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen, within } from "@testing-library/react";
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

describe("mobile portrait layout regressions", () => {
  it("places race controls under the track and above setup on idle", () => {
    const { container } = render(<RaceWorkspace />);
    const markup = container.innerHTML;
    const trackAt = markup.indexOf('data-testid="track-stage"');
    const controlsAt = markup.indexOf('data-testid="race-controls"');
    const setupAt = markup.indexOf('data-testid="setup-card"');
    expect(screen.getByTestId("track-controls").contains(screen.getByTestId("race-controls"))).toBe(
      true,
    );
    expect(screen.getByTestId("setup-card").contains(screen.getByTestId("race-controls"))).toBe(
      false,
    );
    expect(trackAt).toBeLessThan(controlsAt);
    expect(controlsAt).toBeLessThan(setupAt);
  });

  it("keeps speed and start actions on one compact horizontal control row", () => {
    render(<RaceWorkspace />);
    const controls = screen.getByTestId("race-controls");
    expect(controls.className).toContain("flex-wrap");
    expect(controls.className).toContain("justify-center");
    expect(controls.className).toContain("sm:justify-between");
    expect(controls.className).not.toMatch(/(?:^|\s)flex-col(?:\s|$)/);
    expect(controls.contains(screen.getByTestId("playback-speed"))).toBe(true);
    expect(controls.contains(screen.getByRole("button", { name: "Start race" }))).toBe(true);
    expect(screen.getByTestId("playback-speed").className).toContain("justify-center");
    expect(screen.getByRole("button", { name: "Start race" }).className).not.toContain("w-full");
  });

  it("keeps the track panel from flex-shrinking under the setup card", () => {
    const workspace = readFileSync(resolve("src/components/RaceWorkspace.tsx"), "utf8");
    expect(workspace).toContain('className="w-full min-w-0 shrink-0"');
    expect(workspace).not.toMatch(/min-h-0 w-full flex-1/);
  });

  it("stacks track controls below a clipped stage instead of under the SVG", () => {
    render(<RaceWorkspace />);
    const stage = screen.getByTestId("track-stage");
    const controls = screen.getByTestId("track-controls");
    expect(stage.className).toContain("overflow-hidden");
    expect(controls.className).toContain("bg-card");
    expect(controls.className).toContain("z-20");
    expect(controls.className).toContain("shrink-0");
    expect(stage.contains(controls)).toBe(false);
    expect(screen.getByTestId("track-surface-frame").className).toContain("absolute");
    expect(screen.getByTestId("track-surface-frame").className).toContain("overflow-hidden");
  });

  it("keeps finishing-time captions visible and times on their own row under the athlete identity", () => {
    render(<RaceWorkspace />);

    const athleteA = screen.getByTestId("setup-athlete-A");
    expect(athleteA.className).toContain("flex-col");
    expect(within(athleteA).getByText("M")).toBeVisible();
    expect(within(athleteA).getByText("S")).toBeVisible();
    expect(within(athleteA).getByText("100THS")).toBeVisible();

    const minutes = within(athleteA).getByLabelText("Enter your time minutes");
    const timeGroup = minutes.closest("div");
    expect(timeGroup?.className).toContain("w-full");
    expect(timeGroup?.className).toContain("min-w-0");
    expect(athleteA.contains(timeGroup)).toBe(true);

    const identityRow = athleteA.querySelector(":scope > div");
    expect(identityRow?.className).toContain("items-center");
    expect(identityRow?.contains(minutes)).toBe(false);
  });

  it("defers the dense setup row until the large breakpoint", () => {
    render(<RaceWorkspace />);
    expect(screen.getByTestId("setup-card").className).toContain("lg:grid-cols-");
    expect(screen.getByTestId("setup-card").className).not.toMatch(/(?:^|\s)md:grid-cols-/);
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("grid-cols-1");
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("sm:grid-cols-2");
    expect(screen.getByTestId("setup-athlete-A").parentElement?.className).toContain("lg:contents");
  });

  it("hides telemetry while racing and keeps live controls on the track", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    expect(screen.queryByTestId("telemetry-strip")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Select race distance"), "400");
    await setFinishingTimes(user, "2.00", "1.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);

    expect(screen.queryByTestId("telemetry-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("setup-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("race-controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("keeps the infield clock overlaid, scaled down on small screens, and larger on desktop", () => {
    render(<RaceWorkspace />);

    const stage = screen.getByTestId("track-stage");
    const clock = screen.getByTestId("race-clock");
    expect(stage.contains(clock)).toBe(true);
    expect(clock.className).toContain("text-2xl");
    expect(clock.className).toContain("sm:text-4xl");
    expect(clock.className).toContain("md:text-6xl");
    expect(clock.className).toContain("lg:text-7xl");

    const clockShell = clock.parentElement;
    expect(clockShell?.parentElement?.className).toContain("absolute");
    expect(clockShell?.parentElement?.className).toContain("inset-0");
    expect(clockShell?.parentElement?.className).toContain("items-center");
    expect(clockShell?.textContent ?? "").not.toMatch(/seconds/i);

    const trackSource = readFileSync(resolve("src/components/TrackStage.tsx"), "utf8");
    expect(trackSource).toContain("trackViewBox");
    expect(trackSource).toContain("aspectRatio");
    expect(trackSource).toContain("min-h-0");
    expect(trackSource).toContain("sm:max-w-[min(100%,calc(min(44vh,24rem)*${aspect}))]");
    expect(trackSource).toContain("md:max-w-[min(100%,calc(min(42vh,24rem)*${aspect}))]");
    expect(trackSource).toContain("lg:max-w-[min(100%,calc(min(46vh,26rem)*${aspect}))]");
    expect(trackSource).toContain("overflow-hidden");
    expect(trackSource).toContain("absolute inset-0");
    expect(trackSource).toContain("track-surface-frame");
    expect(trackSource).not.toContain("w-[132%]");
    expect(trackSource).not.toContain("w-[140%]");
    expect(trackSource).not.toContain("w-[148%]");
    expect(trackSource).not.toContain("scale(");
    expect(trackSource).not.toContain(">seconds<");
    expect(screen.getByTestId("track-stage").getAttribute("style") ?? "").toMatch(/aspect-ratio/i);

    const trackViewSource = readFileSync(resolve("src/components/trackView.ts"), "utf8");
    expect(trackViewSource).toContain("MARKER_CLEARANCE_M");
    expect(trackViewSource).toContain("SIDE_CLEARANCE_M");
  });
});
