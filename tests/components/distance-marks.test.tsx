import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRenderer } from "@/components/TrackRenderer";
import { DISTANCE_MARKS_M, athleteMarkerLayouts, distanceMarkViews } from "@/components/trackView";

describe("track distance markers", () => {
  it("places 100m, 200m and 300m ticks with the same path sample as an inner-lane athlete", () => {
    const marks = distanceMarkViews();
    expect(marks.map((mark) => mark.distanceM)).toEqual([...DISTANCE_MARKS_M]);

    for (const distanceM of DISTANCE_MARKS_M) {
      const mark = marks.find((entry) => entry.distanceM === distanceM);
      const [inner] = athleteMarkerLayouts(800, [
        { id: "A", name: "Marcelo", distanceCoveredM: distanceM },
        { id: "B", name: "Josh", distanceCoveredM: 0 },
      ]);

      expect(mark?.tick.x).toBe(inner?.marker.x);
      expect(mark?.tick.y).toBe(inner?.marker.y);
    }
  });

  it("keeps 100/200/300 as lap-from-finish stations, not race-covered metres", () => {
    const mark300 = distanceMarkViews().find((entry) => entry.distanceM === 300);
    const [covered300On1500] = athleteMarkerLayouts(1500, [
      { id: "A", name: "Marcelo", distanceCoveredM: 300 },
      { id: "B", name: "Josh", distanceCoveredM: 0 },
    ]);

    expect(mark300?.tick.x).not.toBe(covered300On1500?.marker.x);
    expect(mark300?.tick.y).not.toBe(covered300On1500?.marker.y);
  });

  it("renders the 300m tick on the athlete path, not an approximate label point", () => {
    const mark = distanceMarkViews().find((entry) => entry.distanceM === 300);
    render(
      <TrackRenderer
        raceDistanceM={800}
        athletes={[
          { id: "A", name: "Marcelo", distanceCoveredM: 300 },
          { id: "B", name: "Josh", distanceCoveredM: 0 },
        ]}
      />,
    );

    const tick = screen.getByTestId("distance-mark-tick-300");
    const athlete = screen.getByTestId("athlete-marker-A");
    expect(tick.getAttribute("cx")).toBe(athlete.getAttribute("cx"));
    expect(tick.getAttribute("cy")).toBe(athlete.getAttribute("cy"));
    expect(tick.getAttribute("cx")).toBe(String(mark?.tick.x));
    expect(tick.getAttribute("cy")).toBe(String(mark?.tick.y));
    expect(screen.getByTestId("distance-mark-300")).toHaveAttribute("data-distance-around-m", "300");
    expect(screen.queryByTestId("distance-mark-0")).not.toBeInTheDocument();
  });
});
