import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { PRESENTATION_ASPECT, trackViewBox } from "@/components/trackView";

const REQUIRED_CONTROLS = [
  "Race distance",
  "Athlete A name",
  "Athlete B name",
  "Athlete A minutes",
  "Athlete A seconds",
  "Athlete A hundredths",
  "Athlete B minutes",
  "Athlete B seconds",
  "Athlete B hundredths",
  "Start race",
] as const;

describe("Phase 2B page shell", () => {
  it("renders header, title, setup, track, and telemetry in that order", () => {
    const { container } = render(<Home />);

    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Race My Rival" })).toBeInTheDocument();
    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.getByTestId("track-stage")).toBeInTheDocument();
    expect(screen.getByTestId("telemetry-strip")).toBeInTheDocument();
    expect(screen.getByTestId("race-clock")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toBeInTheDocument();

    const markup = container.innerHTML;
    expect(markup.indexOf("data-testid=\"setup-card\"")).toBeLessThan(
      markup.indexOf("data-testid=\"track-stage\""),
    );
    expect(markup.indexOf("data-testid=\"track-stage\"")).toBeLessThan(
      markup.indexOf("data-testid=\"telemetry-strip\""),
    );
  });

  it("keeps every Phase 1 control on the polished shell", () => {
    render(<RaceWorkspace />);

    for (const name of REQUIRED_CONTROLS) {
      if (name === "Start race") {
        expect(screen.getByRole("button", { name })).toBeEnabled();
      } else if (name === "Race distance") {
        expect(screen.getByLabelText(name)).toBeEnabled();
      } else {
        expect(screen.getByLabelText(name)).toBeInTheDocument();
      }
    }

    expect(screen.getByTestId("playback-speed-1x")).toBeInTheDocument();
    expect(screen.getByTestId("playback-speed-2x")).toBeInTheDocument();
    expect(screen.getByTestId("playback-speed-4x")).toBeInTheDocument();
    expect(screen.getByTestId("playback-speed-8x")).toBeInTheDocument();
    expect(screen.getByText("YOU")).toBeInTheDocument();
    expect(screen.getByText("RIVAL")).toBeInTheDocument();
  });

  it("uses a wider presentation frame without changing athlete distances", () => {
    render(<RaceWorkspace />);
    const viewBox = trackViewBox();
    const aspect = viewBox.width / viewBox.height;
    expect(PRESENTATION_ASPECT).toBe(3);
    expect(aspect).toBeGreaterThanOrEqual(2.7);
    expect(aspect).toBeLessThanOrEqual(3.2);

    const track = screen.getByRole("img", { name: "400 metre stadium race track" });
    expect(track.getAttribute("viewBox")).toBe(viewBox.value);
    expect(track.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    expect(
      document.querySelector("[data-athlete-id='A']")?.getAttribute("data-distance-covered-m"),
    ).toBe("0");
    expect(
      document.querySelector("[data-athlete-id='B']")?.getAttribute("data-distance-covered-m"),
    ).toBe("0");
  });

  it("marks placeholder header destinations as non-navigating", () => {
    render(<Home />);
    expect(screen.getByText("YOUR PB")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("RANKINGS")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("TRAINING")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("PROFILE")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("RACE")).not.toHaveAttribute("aria-disabled");
  });
});
