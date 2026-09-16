import {
  LABEL_CLOSE_GAP_M,
  athleteMarkerLayouts,
} from "@/components/trackView";
import { describe, expect, it } from "vitest";

describe("athlete label proximity stagger", () => {
  it("places close athletes on opposite sides of the markers (above and below)", () => {
    const layouts = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 200 },
      { id: "B", name: "Josh", distanceCoveredM: 200 + LABEL_CLOSE_GAP_M / 2 },
    ]);

    const sides = new Set(layouts.map((layout) => layout.labelSide));
    expect(sides.has("above")).toBe(true);
    expect(sides.has("below")).toBe(true);

    const [upper, lower] = [...layouts].sort((a, b) => a.label.y - b.label.y);
    expect(upper.labelSide).toBe("above");
    expect(lower.labelSide).toBe("below");
    expect(lower.label.y - upper.label.y).toBeGreaterThan(10);
  });

  it("keeps lane infield/outfield labels when athletes are well separated", () => {
    const layouts = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 100 },
      { id: "B", name: "Josh", distanceCoveredM: 100 + LABEL_CLOSE_GAP_M + 20 },
    ]);

    expect(layouts.find((layout) => layout.id === "A")?.labelSide).toBe("infield");
    expect(layouts.find((layout) => layout.id === "B")?.labelSide).toBe("outfield");
  });

  it("does not move markers when staggering close labels", () => {
    const close = [
      { id: "A", name: "Marcelo", distanceCoveredM: 250 },
      { id: "B", name: "Josh", distanceCoveredM: 255 },
    ];
    const staggered = athleteMarkerLayouts(800, close);
    const asFar = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 250 },
      { id: "B", name: "Josh", distanceCoveredM: 250 + LABEL_CLOSE_GAP_M + 40 },
    ]);

    expect(staggered[0]?.marker).toEqual(asFar[0]?.marker);
    expect(staggered[0]?.label).not.toEqual(asFar[0]?.label);
  });

  it("nudges close labels apart on x as well as y so chips do not stack", () => {
    const layouts = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 200 },
      { id: "B", name: "Josh", distanceCoveredM: 202 },
    ]);
    const [left, right] = [...layouts].sort((a, b) => a.label.x - b.label.x);
    expect(Math.abs(right.label.x - left.label.x)).toBeGreaterThanOrEqual(8);
    expect(Math.abs(right.label.y - left.label.y)).toBeGreaterThan(10);
  });
});
