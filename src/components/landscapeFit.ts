"use client";

import { useSyncExternalStore } from "react";

/**
 * Setup bottom-sheet only — short phone/tablet landscape where inline setup
 * fights the track. Roomy landscape (laptop / large iPad) keeps inline SetupCard.
 * Track/header chrome still uses the wider CSS band (landscape + max-height 900px).
 */
export const LANDSCAPE_FIT_MQ =
  "(orientation: landscape) and (max-height: 700px)";

function subscribeLandscapeFit(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(LANDSCAPE_FIT_MQ);
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }
  if (typeof media.addListener === "function") {
    media.addListener(onStoreChange);
    return () => media.removeListener(onStoreChange);
  }
  return () => {};
}

function readLandscapeFit(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(LANDSCAPE_FIT_MQ).matches;
}

function readLandscapeFitServer(): boolean {
  return false;
}

/** True on short landscape viewports; false on server / jsdom without a matching mock. */
export function useLandscapeFit(): boolean {
  return useSyncExternalStore(subscribeLandscapeFit, readLandscapeFit, readLandscapeFitServer);
}
