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
  it("keeps finishing-time captions visible and times on their own row under the athlete identity", () => {
    render(<RaceWorkspace />);

    const athleteA = screen.getByTestId("setup-athlete-A");
    expect(athleteA.className).toContain("flex-col");
    expect(within(athleteA).getByText("M")).toBeVisible();
    expect(within(athleteA).getByText("S")).toBeVisible();
    expect(within(athleteA).getByText("100THS")).toBeVisible();

    const minutes = within(athleteA).getByLabelText("Athlete A minutes");
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

  it("keeps a compact telemetry list with ahead/behind status and shared gap metres", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);

    const strip = screen.getByTestId("telemetry-strip");
    expect(strip.firstElementChild?.className).toContain("rounded-[var(--rmr-radius-card)]");
    expect(strip.firstElementChild?.className).toContain("md:grid-cols-[1fr_auto_1fr]");

    const readoutA = screen.getByTestId("athlete-readout-A");
    const mobileRow = readoutA.querySelector(".md\\:hidden") ?? [...readoutA.querySelectorAll("div")].find((node) =>
      node.className.includes("md:hidden"),
    );
    expect(mobileRow).toBeTruthy();
    expect(mobileRow?.className).toContain("md:hidden");
    expect(within(readoutA).getByText("MA")).toBeInTheDocument();
    expect(within(screen.getByTestId("athlete-readout-B")).getByText("JO")).toBeInTheDocument();
    expect(screen.getAllByText("Level")).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "2.00", "1.00");
    await user.click(screen.getByRole("button", { name: "Start race" }));
    clock.advance(500);

    expect(screen.getByTestId("athlete-distance-A")).toHaveTextContent("100m");
    expect(screen.getByTestId("athlete-distance-B")).toHaveTextContent("200m");
    expect(screen.getByTestId("athlete-speed-A")).toHaveTextContent("200.00m/s");
    expect(screen.getByTestId("athlete-speed-B")).toHaveTextContent("400.00m/s");
    expect(screen.getByTestId("telemetry-gap")).toHaveTextContent("100m");
    expect(within(screen.getByTestId("athlete-readout-A")).getByText("Behind")).toBeInTheDocument();
    expect(within(screen.getByTestId("athlete-readout-B")).getByText("Ahead")).toBeInTheDocument();
  });

  it("keeps the infield clock overlaid, scaled down on small screens, and track zoom mobile-only", () => {
    render(<RaceWorkspace />);

    const stage = screen.getByTestId("track-stage");
    const clock = screen.getByTestId("race-clock");
    expect(stage.contains(clock)).toBe(true);
    expect(clock.className).toContain("text-2xl");
    expect(clock.className).toContain("sm:text-4xl");
    expect(clock.className).toContain("md:text-5xl");

    const clockShell = clock.parentElement;
    expect(clockShell?.parentElement?.className).toContain("absolute");
    expect(clockShell?.parentElement?.className).toContain("inset-0");
    expect(clockShell?.parentElement?.className).toContain("items-center");
    expect(clockShell?.textContent ?? "").not.toMatch(/seconds/i);

    const trackSource = readFileSync(resolve("src/components/TrackStage.tsx"), "utf8");
    expect(trackSource).toContain("min-h-[min(52vh,26rem)]");
    expect(trackSource).toContain("py-2");
    expect(trackSource).not.toContain("w-[132%]");
    expect(trackSource).not.toContain("w-[140%]");
    expect(trackSource).not.toContain("w-[148%]");
    expect(trackSource).not.toContain("scale(");
    expect(trackSource).not.toContain(">seconds<");

    const trackViewSource = readFileSync(resolve("src/components/trackView.ts"), "utf8");
    expect(trackViewSource).toContain("MARKER_CLEARANCE_M");
    expect(trackViewSource).toContain("SIDE_CLEARANCE_M");
  });
});
