import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_LAYOUT_MQ } from "@/components/desktopLayout";
import {
  LANDSCAPE_ORIENTATION_MQ,
  isLandscapeScreen,
  useLandscapeBand,
  useLandscapeFit,
} from "@/components/landscapeFit";
import { RaceWorkspace } from "@/components/RaceWorkspace";

/** Portrait phone screen — keyboard must not flip landscape fit. */
function mockPortraitPhoneScreen(): void {
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
}

/**
 * Soft keyboard shrinks the layout viewport so CSS orientation would report
 * landscape (e.g. 390×364). Screen axes stay portrait.
 */
function mockKeyboardShrunkMatchMedia(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const matches =
        query === LANDSCAPE_ORIENTATION_MQ || query === "(orientation: landscape)"
          ? true
          : query === DESKTOP_LAYOUT_MQ
            ? false
            : query === "(prefers-reduced-motion: reduce)"
              ? false
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

function mockPhoneLandscapeScreen(): void {
  Object.defineProperty(window.screen, "width", { configurable: true, value: 844 });
  Object.defineProperty(window.screen, "height", { configurable: true, value: 390 });
  Object.defineProperty(window.screen, "orientation", {
    configurable: true,
    value: {
      type: "landscape-primary",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("landscape detection vs soft keyboard — regression", () => {
  beforeEach(() => {
    mockPortraitPhoneScreen();
    mockKeyboardShrunkMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("isLandscapeScreen ignores CSS orientation when the device screen is portrait", () => {
    // matchMedia already reports landscape (keyboard height); screen is portrait.
    expect(window.matchMedia(LANDSCAPE_ORIENTATION_MQ).matches).toBe(true);
    expect(isLandscapeScreen()).toBe(false);
  });

  it("useLandscapeFit stays false under a keyboard-shrunk landscape viewport", () => {
    const { result } = renderHook(() => useLandscapeFit());
    expect(result.current).toBe(false);
  });

  it("useLandscapeBand stays none under a keyboard-shrunk landscape viewport", () => {
    const { result } = renderHook(() => useLandscapeBand());
    expect(result.current).toBe("none");
  });

  it("does not swap setup into the landscape sheet when CSS orientation flips from the keyboard", () => {
    render(<RaceWorkspace />);

    expect(screen.getByTestId("setup-card")).toBeInTheDocument();
    expect(screen.queryByTestId("setup-sheet-tab")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Enter your name")).toBeInTheDocument();
    expect(screen.getByLabelText("Enter rival's name")).toBeInTheDocument();
  });

  it("keeps the focused name input mounted when CSS orientation would claim landscape", async () => {
    const user = userEvent.setup();
    render(<RaceWorkspace />);

    const you = screen.getByLabelText("Enter your name");
    await user.click(you);
    await user.type(you, "Sam");

    // Re-assert landscape MQ still "true" (keyboard) while we type.
    expect(window.matchMedia(LANDSCAPE_ORIENTATION_MQ).matches).toBe(true);
    expect(you).toHaveFocus();
    expect(you).toHaveValue("Sam");
    expect(screen.queryByTestId("setup-sheet-tab")).not.toBeInTheDocument();
    // Same DOM node still present — form was not rebuilt into the sheet.
    expect(screen.getByLabelText("Enter your name")).toBe(you);
  });

  it("still opens the setup sheet when the device screen is actually landscape", () => {
    mockPhoneLandscapeScreen();
    // Force store recompute after mutating screen (hook subscribe uses orientation events).
    act(() => {
      window.dispatchEvent(new Event("orientationchange"));
    });

    render(<RaceWorkspace />);

    expect(screen.getByTestId("setup-sheet-tab")).toBeInTheDocument();
    expect(isLandscapeScreen()).toBe(true);
  });
});
