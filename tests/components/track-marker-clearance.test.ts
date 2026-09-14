import { MARKER_RADIUS_M, PIN_STEM_M, athleteMarkerLayouts, trackViewBox } from "@/components/trackView";
import { describe, expect, it } from "vitest";

describe("track marker clearance", () => {
  it("keeps pin heads and labels inside the viewBox around the full lap", () => {
    const viewBox = trackViewBox();
    const sampleDistances = [0, 50, 100, 150, 200, 250, 300, 350, 400, 600, 800];

    for (const distanceCoveredM of sampleDistances) {
      const layouts = athleteMarkerLayouts(800, [
        { id: "A", name: "Marcelo", distanceCoveredM },
        { id: "B", name: "Josh Longer Name", distanceCoveredM: Math.min(800, distanceCoveredM + 15) },
      ]);

      for (const layout of layouts) {
        const pinTop = layout.marker.y - PIN_STEM_M - MARKER_RADIUS_M;
        const pinBottom = layout.marker.y + 1;
        expect(pinTop).toBeGreaterThanOrEqual(viewBox.minY);
        expect(pinBottom).toBeLessThanOrEqual(viewBox.minY + viewBox.height);
        expect(layout.label.y - 2).toBeGreaterThanOrEqual(viewBox.minY);
        expect(layout.label.y + 2).toBeLessThanOrEqual(viewBox.minY + viewBox.height);
        expect(layout.marker.x).toBeGreaterThanOrEqual(viewBox.minX);
        expect(layout.marker.x).toBeLessThanOrEqual(viewBox.minX + viewBox.width);
      }
    }
  });
});
