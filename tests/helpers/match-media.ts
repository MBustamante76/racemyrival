import { vi } from "vitest";
import { DESKTOP_LAYOUT_MQ } from "@/components/desktopLayout";
import { LANDSCAPE_ORIENTATION_MQ } from "@/components/landscapeFit";

/** jsdom matchMedia helper for layout hooks (desktop lg + landscape orientation). */
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
          : query === LANDSCAPE_ORIENTATION_MQ
            ? landscape
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
}
