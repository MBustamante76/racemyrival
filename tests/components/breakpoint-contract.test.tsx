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

  it("styles name fields like bordered inputs", () => {
    render(<RaceWorkspace />);
    const name = screen.getByLabelText("Athlete A name");
    expect(name.className).toContain("border");
    expect(name.className).toContain("border-input-border");
    expect(name.className).toContain("bg-surface-alt");
    expect(name.className).toContain("rounded-[var(--rmr-radius-control)]");
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
    expect(stage).toContain("aspect-[198/134]");
    expect(stage).toContain("min-h-0");
    expect(stage).toContain("sm:aspect-auto");
    expect(stage).toContain("sm:min-h-[min(48vh,24rem)]");
    expect(stage).toContain("md:min-h-[min(56vh,30rem)]");
    expect(stage).toContain("lg:min-h-[min(58vh,34rem)]");
    expect(stage).toContain("md:text-6xl");
    expect(stage).toContain("lg:text-7xl");

    const app = readFileSync(resolve("src/components/RaceApp.tsx"), "utf8");
    expect(app).toContain("px-2 py-2");
    expect(app).toContain("sm:px-4 sm:py-4");
    expect(app).toContain("md:px-6 md:py-5");
    expect(app).toContain("lg:px-8");
    expect(app).toContain("text-3xl");
    expect(app).toContain("sm:text-5xl");

    render(<RaceWorkspace />);
    expect(screen.getByTestId("setup-card").className).toContain("lg:grid-cols-");
    expect(within(screen.getByTestId("setup-athlete-A")).getByLabelText("Athlete A name")).toBeInTheDocument();
  });
});
