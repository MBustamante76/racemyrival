import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRenderer } from "@/components/TrackRenderer";
import type { TrackAthleteView } from "@/components/TrackRenderer";
import { athleteMarkerLayouts, trackViewBox } from "@/components/trackView";
import { createLaneModel, hypot, stadiumTrack } from "@/domain/track";

const DISTANCE_M = 800;
const lanes = createLaneModel("comparison");

const startAthletes: TrackAthleteView[] = [
  { id: "A", name: "Marcelo", distanceCoveredM: 0 },
  { id: "B", name: "Josh", distanceCoveredM: 0 },
];

const midAthletes: TrackAthleteView[] = [
  { id: "A", name: "Marcelo", distanceCoveredM: 200 },
  { id: "B", name: "Josh", distanceCoveredM: 350 },
];

function markerCircle(id: string): SVGCircleElement {
  return screen.getByTestId(`athlete-marker-${id}`) as unknown as SVGCircleElement;
}

function markerPoint(id: string): { x: number; y: number } {
  const circle = markerCircle(id);
  return {
    x: Number(circle.getAttribute("cx")),
    y: Number(circle.getAttribute("cy")),
  };
}

describe("Test gate G", () => {
  it("renders the SVG track, lanes, finish line, both athletes, and labels", () => {
    render(<TrackRenderer raceDistanceM={DISTANCE_M} athletes={startAthletes} />);

    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toBeInTheDocument();
    expect(screen.getByTestId("track-infield")).toBeInTheDocument();
    expect(screen.getByTestId("lane-inner")).toBeInTheDocument();
    expect(screen.getByTestId("lane-adjacent")).toBeInTheDocument();
    expect(screen.getByTestId("finish-line")).toBeInTheDocument();
    expect(screen.getByTestId("finish-label")).toHaveTextContent("Start / Finish");
    expect(screen.getByTestId("athlete-marker-A")).toBeInTheDocument();
    expect(screen.getByTestId("athlete-marker-B")).toBeInTheDocument();
    expect(screen.getByTestId("athlete-label-A")).toHaveTextContent("Marcelo");
    expect(screen.getByTestId("athlete-label-B")).toHaveTextContent("Josh");
  });

  it("moves marker transforms when race distance covered changes", () => {
    const { rerender } = render(
      <TrackRenderer raceDistanceM={DISTANCE_M} athletes={startAthletes} />,
    );
    const startA = markerPoint("A");
    const expectedStart = athleteMarkerLayouts(DISTANCE_M, startAthletes)[0]?.marker;

    expect(startA.x).toBeCloseTo(expectedStart?.x ?? Number.NaN, 8);
    expect(startA.y).toBeCloseTo(expectedStart?.y ?? Number.NaN, 8);

    rerender(<TrackRenderer raceDistanceM={DISTANCE_M} athletes={midAthletes} />);
    const midA = markerPoint("A");
    const expectedMid = athleteMarkerLayouts(DISTANCE_M, midAthletes)[0]?.marker;

    expect(midA.x).toBeCloseTo(expectedMid?.x ?? Number.NaN, 8);
    expect(midA.y).toBeCloseTo(expectedMid?.y ?? Number.NaN, 8);
    expect(midA.x).not.toBeCloseTo(startA.x, 4);
    expect(midA.y).not.toBeCloseTo(startA.y, 4);
  });

  it("keeps equal-distance athletes in adjacent visual lanes", () => {
    const tied: TrackAthleteView[] = [
      { id: "A", name: "Marcelo", distanceCoveredM: 400 },
      { id: "B", name: "Josh", distanceCoveredM: 400 },
    ];
    render(<TrackRenderer raceDistanceM={DISTANCE_M} athletes={tied} />);

    const a = markerPoint("A");
    const b = markerPoint("B");
    const sample = stadiumTrack.sampleForRace(DISTANCE_M, 400);
    const assignments = lanes.assign(["A", "B"]);
    const inner = lanes.visualPosition(sample, assignments[0].lane);
    const adjacent = lanes.visualPosition(sample, assignments[1].lane);

    expect(hypot({ x: a.x - b.x, y: a.y - b.y })).toBeCloseTo(
      hypot({ x: inner.x - adjacent.x, y: inner.y - adjacent.y }),
      8,
    );
    expect(a).not.toEqual(b);

    const labelA = screen.getByTestId("athlete-label-A");
    const labelB = screen.getByTestId("athlete-label-B");
    const labelSeparation = hypot({
      x: Number(labelA.getAttribute("x")) - Number(labelB.getAttribute("x")),
      y: Number(labelA.getAttribute("y")) - Number(labelB.getAttribute("y")),
    });
    expect(labelSeparation).toBeGreaterThan(8);
  });

  it("does not change domain race state when the viewBox is reused", () => {
    const { rerender } = render(
      <TrackRenderer raceDistanceM={DISTANCE_M} athletes={midAthletes} />,
    );
    const svg = screen.getByRole("img", { name: "400 metre stadium race track" });
    const firstViewBox = svg.getAttribute("viewBox");
    expect(firstViewBox).toBe(trackViewBox().value);
    expect(svg.getAttribute("data-race-distance-m")).toBe(String(DISTANCE_M));
    expect(svg.closest("[data-athlete-id='A']") ?? svg.querySelector("[data-athlete-id='A']"))
      .not.toBeNull();
    expect(
      svg.querySelector("[data-athlete-id='A']")?.getAttribute("data-distance-covered-m"),
    ).toBe("200");
    expect(
      svg.querySelector("[data-athlete-id='B']")?.getAttribute("data-distance-covered-m"),
    ).toBe("350");

    rerender(
      <div style={{ width: 320 }}>
        <TrackRenderer raceDistanceM={DISTANCE_M} athletes={midAthletes} />
      </div>,
    );
    const again = screen.getByRole("img", { name: "400 metre stadium race track" });
    expect(again.getAttribute("viewBox")).toBe(firstViewBox);
    expect(again.querySelector("[data-athlete-id='A']")?.getAttribute("data-distance-covered-m")).toBe(
      "200",
    );
    expect(again.querySelector("[data-athlete-id='B']")?.getAttribute("data-distance-covered-m")).toBe(
      "350",
    );
  });

  it("does not own race calculations", () => {
    const renderer = readFileSync(resolve("src/components/TrackRenderer.tsx"), "utf8");
    const view = readFileSync(resolve("src/components/trackView.ts"), "utf8");
    const source = `${renderer}\n${view}`;

    expect(source).not.toContain("averageSpeed");
    expect(source).not.toContain("winnerId");
    expect(source).not.toContain("timeGap");
    expect(source).not.toContain("distanceGap");
    expect(source).not.toContain("RaceClock");
    expect(source).not.toContain("parseRaceTime");
    expect(source).not.toContain("firstFinishTimeMs");
    expect(source).not.toContain("RaceEngine");
    expect(source).not.toContain("completedLaps");
  });

  it("reset props return athletes to their starts", () => {
    const { rerender } = render(
      <TrackRenderer raceDistanceM={DISTANCE_M} athletes={midAthletes} />,
    );
    const midA = markerPoint("A");
    const midB = markerPoint("B");

    rerender(<TrackRenderer raceDistanceM={DISTANCE_M} athletes={startAthletes} />);
    const startA = markerPoint("A");
    const startB = markerPoint("B");
    const expected = athleteMarkerLayouts(DISTANCE_M, startAthletes);

    expect(startA.x).not.toBeCloseTo(midA.x, 4);
    expect(startB.x).not.toBeCloseTo(midB.x, 4);
    expect(startA.x).toBeCloseTo(expected[0]?.marker.x ?? Number.NaN, 8);
    expect(startB.x).toBeCloseTo(expected[1]?.marker.x ?? Number.NaN, 8);
    expect(
      screen
        .getByRole("img", { name: "400 metre stadium race track" })
        .querySelector("[data-athlete-id='A']")
        ?.getAttribute("data-distance-covered-m"),
    ).toBe("0");
  });

  it("places a 1500m start away from the finish line", () => {
    render(
      <TrackRenderer
        raceDistanceM={1500}
        athletes={[
          { id: "A", name: "Marcelo", distanceCoveredM: 0 },
          { id: "B", name: "Josh", distanceCoveredM: 0 },
        ]}
      />,
    );

    expect(screen.getByTestId("start-line")).toBeInTheDocument();
    expect(screen.getByTestId("finish-label")).toHaveTextContent("Finish");

    const startA = markerPoint("A");
    const finishExpected = athleteMarkerLayouts(800, startAthletes)[0]?.marker;
    expect(startA.x).not.toBeCloseTo(finishExpected?.x ?? Number.NaN, 4);
  });
});
