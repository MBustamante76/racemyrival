import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_LAYOUT_MQ } from "@/components/desktopLayout";
import {
  LANDSCAPE_FIT_SHORT_EDGE_MAX,
  LANDSCAPE_INLINE_SHORT_EDGE_MAX,
  isLandscapeScreen,
} from "@/components/landscapeFit";
import { RaceWorkspace } from "@/components/RaceWorkspace";

function mockLandscapeChrome(sheet: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const matches =
        query === DESKTOP_LAYOUT_MQ
          ? !sheet
          : query === "(prefers-reduced-motion: reduce)"
            ? false
            : query.includes("min-width")
              ? !sheet
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
  // Sheet: phone landscape. Non-sheet: tall desktop (short edge above inline max).
  Object.defineProperty(window.screen, "width", {
    configurable: true,
    value: sheet ? 844 : 1440,
  });
  Object.defineProperty(window.screen, "height", {
    configurable: true,
    value: sheet ? 390 : 1024,
  });
  Object.defineProperty(window.screen, "orientation", {
    configurable: true,
    value: {
      type: sheet ? "landscape-primary" : "landscape-primary",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
}

describe("landscape setup bottom sheet", () => {
  beforeEach(() => {
    mockLandscapeChrome(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps inline setup without a sheet tab outside landscape-fit", () => {
    mockLandscapeChrome(false);
    render(<RaceWorkspace />);

    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.queryByTestId("setup-sheet-tab")).not.toBeInTheDocument();
  });

  it("uses screen axes (not viewport orientation) so the keyboard cannot flip the layout", () => {
    expect(LANDSCAPE_FIT_SHORT_EDGE_MAX).toBe(700);
    expect(LANDSCAPE_FIT_SHORT_EDGE_MAX).toBeLessThan(LANDSCAPE_INLINE_SHORT_EDGE_MAX);

    // Portrait phone screen stays portrait even if the layout viewport is short/wide.
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
    expect(isLandscapeScreen()).toBe(false);
  });

  it("shows a closed Race setup tab in landscape-fit and opens the panel on tap", async () => {
    mockLandscapeChrome(true);
    const user = userEvent.setup();
    render(<RaceWorkspace />);

    const tab = screen.getByTestId("setup-sheet-tab");
    expect(tab).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("setup-sheet-panel")).toHaveAttribute("data-open", "false");
    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.queryByTestId("setup-sheet-backdrop")).not.toBeInTheDocument();

    await user.click(tab);
    expect(tab).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("setup-sheet-panel")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("setup-sheet-backdrop")).toBeInTheDocument();
    expect(screen.getByTestId("setup-card")).toBeInTheDocument();

    await user.click(screen.getByTestId("setup-sheet-backdrop"));
    expect(tab).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("setup-sheet-panel")).toHaveAttribute("data-open", "false");
  });

  it("lets runners start from the open setup sheet without dismissing first", async () => {
    mockLandscapeChrome(true);
    const user = userEvent.setup();
    render(<RaceWorkspace />);

    await user.click(screen.getByTestId("setup-sheet-tab"));
    const sheetStart = screen.getByTestId("setup-sheet-start");
    expect(sheetStart).toBeEnabled();
    expect(screen.getByTestId("setup-sheet-footer")).toContainElement(sheetStart);

    await user.click(sheetStart);

    expect(screen.getByTestId("race-status")).toHaveTextContent("running");
    expect(screen.queryByTestId("setup-sheet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("setup-card")).not.toBeInTheDocument();
  });

  it("keeps the track on the sheet size band while landscape-fit is active", () => {
    mockLandscapeChrome(true);
    render(<RaceWorkspace />);
    expect(screen.getByTestId("track-stage")).toHaveAttribute("data-landscape-band", "sheet");
  });
});
