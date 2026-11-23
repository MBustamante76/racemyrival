import { describe, expect, it, vi } from "vitest";
import { isLandscapeScreen } from "@/components/landscapeFit";

describe("landscape detection vs soft keyboard", () => {
  it("stays portrait when the layout viewport is short/wide but the screen is portrait", () => {
    Object.defineProperty(window.screen, "width", { configurable: true, value: 390 });
    Object.defineProperty(window.screen, "height", { configurable: true, value: 844 });
    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: {
        type: "portrait-primary",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    // Simulated keyboard-shrunk layout viewport would be landscape by CSS orientation,
    // but screen axes must win.
    expect(isLandscapeScreen()).toBe(false);
  });
});
