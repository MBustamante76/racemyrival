import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { athleteInitials } from "@/components/athleteDisplay";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { TrackRenderer } from "@/components/TrackRenderer";

describe("James breakpoint and pin contracts", () => {
  it("keeps mobile clock scale and adds larger desktop steps only", () => {
    render(<RaceWorkspace />);
    const clock = screen.getByTestId("race-clock");
    expect(clock.className).toContain("text-2xl");
    expect(clock.className).toContain("sm:text-4xl");
    expect(clock.className).toContain("md:text-6xl");
    expect(clock.className).toContain("lg:text-7xl");
  });

  it("styles name and finishing-time fields like bordered inputs", () => {
    render(<RaceWorkspace />);
    const name = screen.getByLabelText("Enter your name");
    expect(name.className).toContain("border");
    expect(name.className).toContain("border-input-border");
    expect(name.className).toContain("bg-surface-alt");
    expect(name.className).toContain("rounded-[var(--rmr-radius-control)]");

    const minutes = screen.getByLabelText("Enter your time minutes");
    expect(minutes.className).toContain("border");
    expect(minutes.className).toContain("border-input-border");
    expect(minutes.className).toContain("bg-surface-alt");
    expect(minutes.className).toContain("rounded-[var(--rmr-radius-control)]");
  });

  it("uses single-initial pins on the track", () => {
    expect(athleteInitials("Marcelo", { single: true })).toBe("M");
    expect(athleteInitials("Josh", { single: true })).toBe("J");
    expect(athleteInitials("Marcelo")).toBe("MA");

    render(
      <TrackRenderer
        raceDistanceM={800}
        athletes={[
          { id: "A", name: "Marcelo", distanceCoveredM: 0 },
          { id: "B", name: "Josh", distanceCoveredM: 0 },
        ]}
      />,
    );
    const pinA = document.querySelector("[data-athlete-id='A']");
    expect(pinA?.textContent).toContain("M");
    expect(pinA?.textContent).not.toContain("MA");
    const pinB = document.querySelector("[data-athlete-id='B']");
    expect(pinB?.textContent).toContain("J");
    expect(pinB?.textContent).not.toContain("JO");
  });

  it("lists additive breakpoint tokens without rewriting the mobile baseline", () => {
    const stage = readFileSync(resolve("src/components/TrackStage.tsx"), "utf8");
    expect(stage).toContain("trackViewBox");
    expect(stage).toContain("aspectRatio");
    expect(stage).toContain("min-h-0");
    expect(stage).toContain("max-h-[calc(100svh-5.5rem)]");
    expect(stage).toContain("max-w-[min(100%,calc((100svh-5.5rem)*var(--track-aspect)))]");
    expect(stage).toContain("sm:max-w-[min(100%,calc(min(44svh,24rem)*var(--track-aspect)))]");
    expect(stage).toContain("md:max-w-[min(100%,calc(min(42svh,24rem)*var(--track-aspect)))]");
    expect(stage).toContain("lg:max-w-[min(100%,calc(min(46svh,26rem)*var(--track-aspect)))]");
    expect(stage).toContain("xl:max-w-[min(100%,calc(min(50svh,30rem)*var(--track-aspect)))]");
    expect(stage).toContain("max-height:900px");
    expect(stage).toContain("max-h-[calc(100svh-8rem)]");
    expect(stage).toContain("max-w-[min(100%,calc((100svh-8rem)*var(--track-aspect)))]");
    expect(stage).toContain("--track-aspect");
    expect(stage).not.toContain("max-height:500px");
    expect(stage).toContain("overflow-hidden");
    expect(stage).toContain("track-surface-frame");
    expect(stage).toContain("md:text-6xl");
    expect(stage).toContain("lg:text-7xl");

    const app = readFileSync(resolve("src/components/RaceApp.tsx"), "utf8");
    expect(app).toContain("px-2 py-2");
    expect(app).toContain("sm:px-4 sm:py-3");
    expect(app).toContain("md:px-6 md:py-3");
    expect(app).toContain("lg:px-8");
    expect(app).toContain("text-3xl");
    expect(app).toContain("sm:text-4xl");
    expect(app).toContain("lg:text-5xl");

    render(<RaceWorkspace />);
    expect(screen.getByTestId("setup-card").className).toContain("lg:grid-cols-");
    expect(within(screen.getByTestId("setup-athlete-A")).getByLabelText("Enter your name")).toBeInTheDocument();
    expect(screen.getByTestId("track-stage").getAttribute("style") ?? "").toMatch(/aspect-ratio/i);
  });
});
