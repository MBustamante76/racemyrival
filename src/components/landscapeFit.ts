"use client";

import { useSyncExternalStore } from "react";

/**
 * Setup bottom-sheet only — short phone/tablet landscape where inline setup
 * fights the track. Roomy landscape (laptop / large iPad) keeps inline SetupCard.
 *
 * Landscape is detected from the **device screen** (width/height or
 * screen.orientation), never from CSS `(orientation: landscape)`. The latter
 * follows the layout viewport, so an iPhone soft keyboard can make portrait
 * look like landscape and rebuild the setup form (dropping focus).
 */
/** @deprecated Not used for detection — kept so older tests/docs still import a name. */
export const LANDSCAPE_ORIENTATION_MQ = "(orientation: landscape)";

/** Short edge ≤ this → landscape setup sheet + tight track budget. */
export const LANDSCAPE_FIT_SHORT_EDGE_MAX = 700;

/** Short edge ≤ this (and above sheet max) → roomy landscape track budget, inline setup. */
export const LANDSCAPE_INLINE_SHORT_EDGE_MAX = 900;

/** @deprecated Alias for tests/docs — detection is screen axes + short edge, not layout max-height. */
export const LANDSCAPE_FIT_MQ = `${LANDSCAPE_ORIENTATION_MQ} and (max-height: ${LANDSCAPE_FIT_SHORT_EDGE_MAX}px)`;

export type LandscapeBand = "none" | "sheet" | "inline";

type LandscapeSnapshot = {
  landscape: boolean;
  shortEdge: number;
  band: LandscapeBand;
};

const serverSnapshot: LandscapeSnapshot = {
  landscape: false,
  shortEdge: LANDSCAPE_INLINE_SHORT_EDGE_MAX + 1,
  band: "none",
};

let clientSnapshot: LandscapeSnapshot = serverSnapshot;

function screenShortEdge(): number {
  return Math.min(window.screen.width, window.screen.height);
}

/** True when the device is held/rotated landscape — stable while the keyboard is open. */
export function isLandscapeScreen(): boolean {
  const type = window.screen?.orientation?.type;
  if (typeof type === "string") {
    return type.startsWith("landscape");
  }
  return window.screen.width > window.screen.height;
}

function bandFor(landscape: boolean, shortEdge: number): LandscapeBand {
  if (!landscape) {
    return "none";
  }
  if (shortEdge <= LANDSCAPE_FIT_SHORT_EDGE_MAX) {
    return "sheet";
  }
  if (shortEdge <= LANDSCAPE_INLINE_SHORT_EDGE_MAX) {
    return "inline";
  }
  return "none";
}

function computeSnapshot(): LandscapeSnapshot {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }
  const landscape = isLandscapeScreen();
  const shortEdge = screenShortEdge();
  const band = bandFor(landscape, shortEdge);
  if (
    clientSnapshot.landscape === landscape &&
    clientSnapshot.shortEdge === shortEdge &&
    clientSnapshot.band === band
  ) {
    return clientSnapshot;
  }
  clientSnapshot = { landscape, shortEdge, band };
  return clientSnapshot;
}

function subscribeLandscape(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onChange = () => {
    computeSnapshot();
    onStoreChange();
  };
  computeSnapshot();

  const orientation = window.screen?.orientation;
  if (orientation && typeof orientation.addEventListener === "function") {
    orientation.addEventListener("change", onChange);
  }
  window.addEventListener("orientationchange", onChange);

  return () => {
    if (orientation && typeof orientation.removeEventListener === "function") {
      orientation.removeEventListener("change", onChange);
    }
    window.removeEventListener("orientationchange", onChange);
  };
}

function getSnapshot(): LandscapeSnapshot {
  return computeSnapshot();
}

function getServerSnapshot(): LandscapeSnapshot {
  return serverSnapshot;
}

/** True on short-edge phone/tablet landscape; false on server / roomy landscape. */
export function useLandscapeFit(): boolean {
  return useSyncExternalStore(subscribeLandscape, getSnapshot, getServerSnapshot).band === "sheet";
}

/** Stable landscape sizing band for track chrome (ignores soft-keyboard height). */
export function useLandscapeBand(): LandscapeBand {
  return useSyncExternalStore(subscribeLandscape, getSnapshot, getServerSnapshot).band;
}

/**
 * Set on documentElement while a short-edge phone landscape race is live so
 * partner/brand chrome can collapse and the track can become the hero.
 */
export const LANDSCAPE_RACE_ATTR = "data-rmr-landscape-race";
