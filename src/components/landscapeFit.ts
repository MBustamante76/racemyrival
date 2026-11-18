"use client";

import { useSyncExternalStore } from "react";

/**
 * Setup bottom-sheet only — short phone/tablet landscape where inline setup
 * fights the track. Roomy landscape (laptop / large iPad) keeps inline SetupCard.
 *
 * Uses the device screen short edge (not live layout height) so the soft keyboard
 * cannot flip sheet ↔ inline mid-typing and bounce the track frame.
 */
export const LANDSCAPE_ORIENTATION_MQ = "(orientation: landscape)";

/** Short edge ≤ this → landscape setup sheet + tight track budget. */
export const LANDSCAPE_FIT_SHORT_EDGE_MAX = 700;

/** Short edge ≤ this (and above sheet max) → roomy landscape track budget, inline setup. */
export const LANDSCAPE_INLINE_SHORT_EDGE_MAX = 900;

/** @deprecated Alias for tests/docs — detection is orientation + screen short edge, not layout max-height. */
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
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return serverSnapshot;
  }
  const landscape = window.matchMedia(LANDSCAPE_ORIENTATION_MQ).matches;
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
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(LANDSCAPE_ORIENTATION_MQ);
  const onChange = () => {
    computeSnapshot();
    onStoreChange();
  };
  // Prime cache so the first getSnapshot is stable.
  computeSnapshot();
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }
  if (typeof media.addListener === "function") {
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }
  return () => {};
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
