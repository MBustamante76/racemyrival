"use client";

import { useSyncExternalStore } from "react";

/** Tailwind `lg` — desktop setup keeps Start under the track. */
export const DESKTOP_LAYOUT_MQ = "(min-width: 1024px)";

type DesktopSnapshot = { desktop: boolean };

const serverSnapshot: DesktopSnapshot = { desktop: false };
let clientSnapshot: DesktopSnapshot = serverSnapshot;

function computeSnapshot(): DesktopSnapshot {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return serverSnapshot;
  }
  const desktop = window.matchMedia(DESKTOP_LAYOUT_MQ).matches;
  if (clientSnapshot.desktop === desktop) {
    return clientSnapshot;
  }
  clientSnapshot = { desktop };
  return clientSnapshot;
}

function subscribeDesktop(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(DESKTOP_LAYOUT_MQ);
  const onChange = () => {
    computeSnapshot();
    onStoreChange();
  };
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

function getSnapshot(): DesktopSnapshot {
  return computeSnapshot();
}

function getServerSnapshot(): DesktopSnapshot {
  return serverSnapshot;
}

/** True at Tailwind `lg` and up. */
export function useDesktopLayout(): boolean {
  return useSyncExternalStore(subscribeDesktop, getSnapshot, getServerSnapshot).desktop;
}
