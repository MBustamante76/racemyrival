import { vi } from "vitest";
import { DESKTOP_LAYOUT_MQ } from "@/components/desktopLayout";

/** jsdom matchMedia + screen axes helper for layout hooks. */
export function mockLayoutMedia({
  desktop = false,
  landscape = false,
}: {
  desktop?: boolean;
  landscape?: boolean;
} = {}): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const matches =
        query === DESKTOP_LAYOUT_MQ
          ? desktop
          : query === "(prefers-reduced-motion: reduce)"
            ? false
            : query.includes("min-width")
              ? desktop || query.includes("768")
              : false;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });

  // Landscape fit uses physical screen axes (not CSS orientation / viewport).
  Object.defineProperty(window.screen, "width", {
    configurable: true,
    value: landscape ? 844 : desktop ? 1440 : 390,
  });
  Object.defineProperty(window.screen, "height", {
    configurable: true,
    value: landscape ? 390 : desktop ? 900 : 844,
  });
  Object.defineProperty(window.screen, "orientation", {
    configurable: true,
    value: {
      type: landscape ? "landscape-primary" : "portrait-primary",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
}
