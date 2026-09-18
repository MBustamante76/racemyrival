import {
  LABEL_CLOSE_EXIT_GAP_M,
  LABEL_CLOSE_GAP_M,
  athleteMarkerLayouts,
  layoutAthleteMarkers,
  resolveCloseMode,
} from "@/components/trackView";
import {
  blendLayoutsTowardTargets,
  labelOffsetFromMarker,
  labelLerpProgress,
} from "@/components/smoothMarkerLabels";
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

  it("uses hysteresis so a gap between enter and exit stays in close mode", () => {
    const midGap = (LABEL_CLOSE_GAP_M + LABEL_CLOSE_EXIT_GAP_M) / 2;
    expect(
      resolveCloseMode(
        [
          { id: "A", name: "Marcelo", distanceCoveredM: 200 },
          { id: "B", name: "Josh", distanceCoveredM: 200 + midGap },
        ],
        false,
      ),
    ).toBe(false);
    expect(
      resolveCloseMode(
        [
          { id: "A", name: "Marcelo", distanceCoveredM: 200 },
          { id: "B", name: "Josh", distanceCoveredM: 200 + midGap },
        ],
        true,
      ),
    ).toBe(true);

    const entered = layoutAthleteMarkers(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 200 },
      { id: "B", name: "Josh", distanceCoveredM: 210 },
    ]);
    expect(entered.proximity.closeMode).toBe(true);

    const held = layoutAthleteMarkers(
      800,
      [
        { id: "A", name: "Marcelo", distanceCoveredM: 200 },
        { id: "B", name: "Josh", distanceCoveredM: 200 + midGap },
      ],
      entered.proximity,
    );
    expect(held.proximity.closeMode).toBe(true);
    expect(
      held.layouts.every((layout) => layout.labelSide === "above" || layout.labelSide === "below"),
    ).toBe(true);

    const exited = layoutAthleteMarkers(
      800,
      [
        { id: "A", name: "Marcelo", distanceCoveredM: 200 },
        { id: "B", name: "Josh", distanceCoveredM: 200 + LABEL_CLOSE_EXIT_GAP_M + 1 },
      ],
      held.proximity,
    );
    expect(exited.proximity.closeMode).toBe(false);
    expect(exited.layouts.find((layout) => layout.id === "A")?.labelSide).toBe("infield");
  });

  it("keeps sticky above/below sides while close mode remains active", () => {
    const first = layoutAthleteMarkers(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 200 },
      { id: "B", name: "Josh", distanceCoveredM: 205 },
    ]);
    const sideA = first.layouts.find((layout) => layout.id === "A")?.labelSide;
    const sideB = first.layouts.find((layout) => layout.id === "B")?.labelSide;
    expect(sideA === "above" || sideA === "below").toBe(true);
    expect(sideB === "above" || sideB === "below").toBe(true);
    expect(sideA).not.toBe(sideB);

    const second = layoutAthleteMarkers(
      800,
      [
        { id: "A", name: "Marcelo", distanceCoveredM: 220 },
        { id: "B", name: "Josh", distanceCoveredM: 200 },
      ],
      first.proximity,
    );
    expect(second.layouts.find((layout) => layout.id === "A")?.labelSide).toBe(sideA);
    expect(second.layouts.find((layout) => layout.id === "B")?.labelSide).toBe(sideB);
  });
});

describe("smooth marker label blend", () => {
  it("interpolates label offsets between placements", () => {
    const far = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 100 },
      { id: "B", name: "Josh", distanceCoveredM: 100 + LABEL_CLOSE_GAP_M + 40 },
    ]);
    const close = athleteMarkerLayouts(800, [
      { id: "A", name: "Marcelo", distanceCoveredM: 100 },
      { id: "B", name: "Josh", distanceCoveredM: 105 },
    ]);
    const fromOffsets = Object.fromEntries(
      far.map((layout) => [layout.id, labelOffsetFromMarker(layout)]),
    );

    const atStart = blendLayoutsTowardTargets(close, fromOffsets, 0);
    expect(atStart[0]?.label.x).toBeCloseTo(far[0]!.marker.x + fromOffsets.A!.x, 5);
    expect(atStart[0]?.label.y).toBeCloseTo(far[0]!.marker.y + fromOffsets.A!.y, 5);

    const atEnd = blendLayoutsTowardTargets(close, fromOffsets, 1);
    expect(atEnd[0]?.label).toEqual(close[0]?.label);
    expect(atEnd[1]?.label).toEqual(close[1]?.label);

    const mid = blendLayoutsTowardTargets(close, fromOffsets, 0.5);
    const midY = mid[0]!.label.y;
    const startY = atStart[0]!.label.y;
    const endY = atEnd[0]!.label.y;
    expect(midY).toBeGreaterThan(Math.min(startY, endY));
    expect(midY).toBeLessThan(Math.max(startY, endY));
  });

  it("reports lerp progress over the label slide window", () => {
    expect(labelLerpProgress(1000, 1000)).toBe(0);
    expect(labelLerpProgress(1000, 1100)).toBe(0.5);
    expect(labelLerpProgress(1000, 1200)).toBe(1);
    expect(labelLerpProgress(1000, 1500)).toBe(1);
  });
});
