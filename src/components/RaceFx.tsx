"use client";

import { useEffect, useRef, useState } from "react";
import { fireFinishConfetti } from "./finishConfettiBurst";
import { playFinishCheer, playStartGun, preloadRaceAudio } from "./raceAudio";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { prefersReducedMotion };

export function RaceStartFlash({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="race-start-flash"
      className="race-start-flash pointer-events-none absolute inset-0 z-20"
    />
  );
}

/** Marker for tests / a11y while tsParticles confetti runs on the page. */
export function RaceFinishConfetti({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="race-finish-confetti"
      className="pointer-events-none absolute inset-0 z-20"
    />
  );
}

/**
 * Start FX are armed from Start/Replay (gun bang before go).
 * Finish FX fire when the winner crosses (`raceWon`).
 */
export function useRaceBookendFx(raceWon = false): {
  startFlash: boolean;
  finishConfetti: boolean;
  triggerStartFx: () => void;
} {
  const [startFlash, setStartFlash] = useState(false);
  const [wonSeen, setWonSeen] = useState(raceWon);
  const [finishExpired, setFinishExpired] = useState(false);
  const startFlashTimer = useRef<number | null>(null);

  if (wonSeen !== raceWon) {
    setWonSeen(raceWon);
    setFinishExpired(false);
  }

  const finishConfetti = raceWon && !finishExpired;

  useEffect(() => {
    preloadRaceAudio();
  }, []);

  useEffect(() => {
    return () => {
      if (startFlashTimer.current !== null) {
        window.clearTimeout(startFlashTimer.current);
      }
    };
  }, []);

  function triggerStartFx(): void {
    if (startFlashTimer.current !== null) {
      window.clearTimeout(startFlashTimer.current);
    }
    setStartFlash(true);
    if (!prefersReducedMotion()) {
      playStartGun();
    }
    startFlashTimer.current = window.setTimeout(() => {
      setStartFlash(false);
      startFlashTimer.current = null;
    }, 450);
  }

  useEffect(() => {
    if (!raceWon) {
      return undefined;
    }

    if (!prefersReducedMotion()) {
      playFinishCheer();
      void fireFinishConfetti().catch(() => {
        // Canvas / WebGL may be unavailable.
      });
    }
    const timer = window.setTimeout(() => setFinishExpired(true), 2800);
    return () => window.clearTimeout(timer);
  }, [raceWon]);

  return { startFlash, finishConfetti, triggerStartFx };
}

export function scrollTrackIntoView(element: HTMLElement | null): void {
  if (!element || typeof element.scrollIntoView !== "function") {
    return;
  }
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  element.scrollIntoView({ behavior, block: "start" });
}
