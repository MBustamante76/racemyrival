import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANDSCAPE_FIT_MQ } from "@/components/landscapeFit";
import { RaceWorkspace } from "@/components/RaceWorkspace";

function mockMatchMedia(landscapeFitMatches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const matches =
        query === LANDSCAPE_FIT_MQ
          ? landscapeFitMatches
          : query === "(prefers-reduced-motion: reduce)"
            ? false
            : query.includes("min-width")
              ? true
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

describe("landscape setup bottom sheet", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps inline setup without a sheet tab outside landscape-fit", () => {
    mockMatchMedia(false);
    render(<RaceWorkspace />);

    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.queryByTestId("setup-sheet-tab")).not.toBeInTheDocument();
  });

  it("uses a shorter landscape band than track chrome so roomy landscape keeps inline setup", () => {
    expect(LANDSCAPE_FIT_MQ).toBe("(orientation: landscape) and (max-height: 700px)");
    expect(LANDSCAPE_FIT_MQ).not.toContain("900px");
  });

  it("shows a closed Race setup tab in landscape-fit and opens the panel on tap", async () => {
    mockMatchMedia(true);
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
    mockMatchMedia(true);
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
});
