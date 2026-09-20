"use client";

import { useSyncExternalStore } from "react";

/** Same band as track chrome compaction (phone → iPad → short laptop landscape). */
export const LANDSCAPE_FIT_MQ = "(orientation: landscape) and (max-height: 900px)";

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
