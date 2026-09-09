import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRenderer } from "@/components/TrackRenderer";
import { athleteMarkerLayouts, distanceMarkViews, trackSurfacePath } from "@/components/trackView";

const twoAthletes = [
  { id: "A", name: "Marcelo", distanceCoveredM: 0 },
  { id: "B", name: "Josh", distanceCoveredM: 0 },
];

describe("Phase 2D track polish", () => {
  it("shows the 100m chute and START 100m only on the sprint course", () => {
    const { rerender } = render(<TrackRenderer raceDistanceM={100} athletes={twoAthletes} />);
    expect(screen.getByRole("img")).toHaveAttribute("data-course-type", "sprint-straight");
    expect(screen.getByTestId("sprint-chute")).toBeInTheDocument();
    expect(screen.getByTestId("sprint-start-label")).toHaveTextContent("START 100m");
    expect(screen.getByRole("img").querySelectorAll('[data-testid^="sprint-chute-lane-"]')).toHaveLength(3);
    const startLabel = screen.getByTestId("sprint-start-label");
    const outerName = screen.getByTestId("athlete-label-B");
    expect(startLabel.getAttribute("x")).not.toBe(outerName.getAttribute("x"));
    expect(screen.getByTestId("finish-label")).toHaveTextContent("Finish");
    expect(screen.queryByTestId("start-line")).not.toBeInTheDocument();
    expect(screen.getByTestId("distance-mark-300")).toBeInTheDocument();

    rerender(<TrackRenderer raceDistanceM={800} athletes={twoAthletes} />);
    expect(screen.getByRole("img")).toHaveAttribute("data-course-type", "stadium-oval");
    expect(screen.queryByTestId("sprint-chute")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sprint-start-label")).not.toBeInTheDocument();
    expect(screen.getByTestId("distance-mark-100")).toBeInTheDocument();
    expect(screen.getByTestId("distance-mark-200")).toBeInTheDocument();
    expect(screen.getByTestId("distance-mark-300")).toBeInTheDocument();
  });

  it("keeps marker distanceCoveredM when labels flip", () => {
    const base = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 250 },
      { id: "B", name: "Josh", distanceCoveredM: 310 },
    ]);
    const flipped = athleteMarkerLayouts(
      800,
      [
        { id: "A", name: "Marcelo", distanceCoveredM: 250 },
        { id: "B", name: "Josh", distanceCoveredM: 310 },
      ],
      ["A", "B"],
      { flipLabels: true },
    );

    expect(flipped[0]?.distanceCoveredM).toBe(250);
    expect(flipped[1]?.distanceCoveredM).toBe(310);
    expect(flipped[0]?.marker).toEqual(base[0]?.marker);
    expect(flipped[1]?.marker).toEqual(base[1]?.marker);
    expect(flipped[0]?.label).not.toEqual(base[0]?.label);
  });

  it("fills the track as an even-odd ring instead of a single shredded polygon", () => {
    render(<TrackRenderer raceDistanceM={800} athletes={twoAthletes} />);
    const surface = screen.getByTestId("track-surface");
    expect(surface.tagName.toLowerCase()).toBe("path");
    expect(surface.getAttribute("fill-rule")).toBe("evenodd");
    expect((trackSurfacePath().match(/M /g) ?? []).length).toBe(2);
  });

  it("draws one terracotta lane per runner", () => {
    const { rerender } = render(<TrackRenderer raceDistanceM={800} athletes={twoAthletes} />);
    const svg = screen.getByRole("img");
    expect(svg).toHaveAttribute("data-runner-count", "2");
    expect(screen.getByTestId("runner-track-A")).toBeInTheDocument();
    expect(screen.getByTestId("runner-track-B")).toBeInTheDocument();
    expect(screen.queryByTestId("runner-track-C")).not.toBeInTheDocument();
    expect(svg.querySelectorAll('[data-testid^="runner-track-"]')).toHaveLength(2);

    rerender(
      <TrackRenderer
        raceDistanceM={800}
        athletes={[
          ...twoAthletes,
          { id: "C", name: "Alex", distanceCoveredM: 0 },
        ]}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("data-runner-count", "3");
    expect(screen.getByTestId("runner-track-C")).toBeInTheDocument();
    expect(screen.getByRole("img").querySelectorAll('[data-testid^="runner-track-"]')).toHaveLength(3);
  });

  it("does not move oval 300m marks when 100m athletes start on the chute", () => {
    const oval300 = distanceMarkViews().find((mark) => mark.distanceM === 300);
    const [sprintStart] = athleteMarkerLayouts(100, twoAthletes);

    expect(sprintStart?.distanceCoveredM).toBe(0);
    expect(sprintStart?.marker.x).not.toBe(oval300?.tick.x);
    expect(sprintStart?.marker.y).not.toBe(oval300?.tick.y);
  });
});
