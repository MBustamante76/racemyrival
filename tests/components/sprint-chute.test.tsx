import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRenderer } from "@/components/TrackRenderer";
import { athleteMarkerLayouts, distanceMarkViews, trackViewBox } from "@/components/trackView";
import { hypot, sprintStraight } from "@/domain/track";

const two = [
  { id: "A", name: "Marcelo", distanceCoveredM: 0 },
  { id: "B", name: "Josh", distanceCoveredM: 0 },
];

function markerPoint(id: string): { x: number; y: number } {
  const circle = screen.getByTestId(`athlete-marker-${id}`);
  return {
    x: Number(circle.getAttribute("cx")),
    y: Number(circle.getAttribute("cy")),
  };
}

describe("100m sprint chute view", () => {
  it("shows the sprint start line for 100m and keeps the 300m oval mark", () => {
    render(<TrackRenderer raceDistanceM={100} athletes={two} />);

    expect(screen.getByRole("img")).toHaveAttribute("data-course-type", "sprint-straight");
    expect(screen.getByTestId("sprint-start-line")).toBeInTheDocument();
    expect(screen.getByTestId("sprint-start-label")).toHaveTextContent("START 100m");
    expect(screen.getByTestId("distance-mark-100")).toHaveTextContent("100m");
    expect(screen.getByTestId("finish-label")).toHaveTextContent("Finish");
    expect(screen.getByTestId("sprint-chute-inner")).toBeInTheDocument();
    expect(screen.queryByTestId("start-line")).not.toBeInTheDocument();

    const startLine = screen.getByTestId("sprint-start-line");
    const box = trackViewBox();
    const startX = Number(startLine.getAttribute("x1"));
    const startLength = hypot({
      x: Number(startLine.getAttribute("x2")) - Number(startLine.getAttribute("x1")),
      y: Number(startLine.getAttribute("y2")) - Number(startLine.getAttribute("y1")),
    });
    expect(startX).toBeGreaterThan(box.minX);
    expect(startX).toBeLessThan(box.minX + box.width);
    expect(startLength).toBeGreaterThan(4);

    const startLabel = screen.getByTestId("sprint-start-label");
    expect(Number(startLabel.getAttribute("x"))).toBeGreaterThan(box.minX);
    expect(Number(startLabel.getAttribute("y"))).toBeLessThan(box.minY + box.height);

    const mark300 = distanceMarkViews().find((mark) => mark.distanceM === 300);
    const [oval300] = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 300 },
      { id: "B", name: "Josh", distanceCoveredM: 0 },
    ]);
    expect(mark300?.tick.x).toBe(oval300?.marker.x);
    expect(mark300?.tick.y).toBe(oval300?.marker.y);
    expect(screen.getByTestId("distance-mark-300")).toHaveAttribute("data-distance-around-m", "300");
  });

  it("places both 100m athletes on the straight, never on a bend", () => {
    const { rerender } = render(<TrackRenderer raceDistanceM={100} athletes={two} />);
    const start = sprintStraight.sampleAtDistance(0);
    const finish = sprintStraight.sampleAtDistance(100);
    const startInner = athleteMarkerLayouts(100, two);
    const innerY = startInner[0]?.marker.y ?? Number.NaN;
    const adjacentY = startInner[1]?.marker.y ?? Number.NaN;

    for (const covered of [0, 25, 50, 75, 100]) {
      rerender(
        <TrackRenderer
          raceDistanceM={100}
          athletes={[
            { id: "A", name: "Marcelo", distanceCoveredM: covered },
            { id: "B", name: "Josh", distanceCoveredM: covered },
          ]}
        />,
      );
      const a = markerPoint("A");
      const b = markerPoint("B");
      expect(a.y).toBeCloseTo(innerY, 5);
      expect(b.y).toBeCloseTo(adjacentY, 5);
      expect(a.y).not.toBeCloseTo(b.y, 4);
      expect(a.x).toBeCloseTo(b.x, 5);
      expect(a.x).toBeGreaterThanOrEqual(Number(start.position.x.toFixed(6)) - 0.01);
      expect(a.x).toBeLessThanOrEqual(Number(finish.position.x.toFixed(6)) + 0.01);
    }
  });

  it("keeps the 100m start distinct from the 300m oval marker", () => {
    const [inner] = athleteMarkerLayouts(100, two);
    const mark300 = distanceMarkViews().find((mark) => mark.distanceM === 300);
    const ovalStart = athleteMarkerLayouts(400, [
      { id: "A", name: "Marcelo", distanceCoveredM: 300 },
      { id: "B", name: "Josh", distanceCoveredM: 0 },
    ])[0];

    expect(inner?.marker.x).not.toBeCloseTo(mark300?.tick.x ?? Number.NaN, 8);
    expect(inner?.marker.y).not.toBeCloseTo(mark300?.tick.y ?? Number.NaN, 8);
    expect(hypot({
      x: (inner?.marker.x ?? 0) - (mark300?.tick.x ?? 0),
      y: (inner?.marker.y ?? 0) - (mark300?.tick.y ?? 0),
    })).toBeGreaterThan(1);
    expect(inner?.marker.x).not.toBeCloseTo(ovalStart?.marker.x ?? Number.NaN, 8);
    expect(inner?.marker.y).not.toBeCloseTo(ovalStart?.marker.y ?? Number.NaN, 8);
  });

  it("pins a finished 100m runner to the shared finish line", () => {
    const [sprintDone] = athleteMarkerLayouts(100, [
      { id: "A", name: "Marcelo", distanceCoveredM: 100 },
      { id: "B", name: "Josh", distanceCoveredM: 100 },
    ]);
    const [ovalDone] = athleteMarkerLayouts(400, [
      { id: "A", name: "Marcelo", distanceCoveredM: 400 },
      { id: "B", name: "Josh", distanceCoveredM: 400 },
    ]);

    expect(sprintDone?.marker.x).toBeCloseTo(ovalDone?.marker.x ?? Number.NaN, 8);
    expect(sprintDone?.marker.y).toBeCloseTo(ovalDone?.marker.y ?? Number.NaN, 8);
  });

  it("does not put 400m athletes on the sprint course", () => {
    render(<TrackRenderer raceDistanceM={400} athletes={two} />);
    expect(screen.getByRole("img")).toHaveAttribute("data-course-type", "oval");
    expect(screen.queryByTestId("sprint-start-line")).not.toBeInTheDocument();
    expect(screen.getByTestId("finish-label")).toHaveTextContent("Start / Finish");
  });
});
