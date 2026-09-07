import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRenderer } from "@/components/TrackRenderer";
import { trackViewBox } from "@/components/trackView";
import Home from "@/app/page";

const twoAthletes = [
  { id: "A", name: "Marcelo", distanceCoveredM: 0 },
  { id: "B", name: "Josh", distanceCoveredM: 0 },
];

describe("Test gate J", () => {
  it("keeps SVG aspect ratio and a stable viewBox in a narrow container", () => {
    const { rerender } = render(
      <div style={{ width: 1280 }}>
        <TrackRenderer raceDistanceM={800} athletes={twoAthletes} />
      </div>,
    );
    const wide = screen.getByRole("img", { name: "400 metre stadium race track" });
    expect(wide.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    expect(wide.getAttribute("viewBox")).toBe(trackViewBox().value);
    expect(wide.classList.contains("w-full")).toBe(true);
    expect(wide.classList.contains("h-auto")).toBe(true);

    const aWide = wide.querySelector("[data-athlete-id='A']")?.getAttribute("data-distance-covered-m");
    rerender(
      <div style={{ width: 320 }}>
        <TrackRenderer raceDistanceM={800} athletes={twoAthletes} />
      </div>,
    );
    const narrow = screen.getByRole("img", { name: "400 metre stadium race track" });
    expect(narrow.getAttribute("viewBox")).toBe(wide.getAttribute("viewBox"));
    expect(narrow.querySelector("[data-athlete-id='A']")?.getAttribute("data-distance-covered-m")).toBe(
      aWide,
    );
  });

  it("shows a separate 1500m and 3000m start from the finish", () => {
    const { rerender } = render(<TrackRenderer raceDistanceM={1500} athletes={twoAthletes} />);
    expect(screen.getByTestId("start-line")).toBeInTheDocument();
    expect(screen.getByTestId("finish-label")).toHaveTextContent("Finish");

    rerender(<TrackRenderer raceDistanceM={3000} athletes={twoAthletes} />);
    expect(screen.getByTestId("start-line")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("data-race-distance-m", "3000");
  });

  it("keeps the homepage controls usable in the document flow", () => {
    render(<Home />);
    expect(screen.getByLabelText("Race distance")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toBeInTheDocument();
  });
});
