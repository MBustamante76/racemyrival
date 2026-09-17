"use client";

import { useEffect, useRef, useState } from "react";
import { fireFinishConfetti } from "./finishConfettiBurst";

const START_GUN_SRC = "/audio/starting_gun.mp3";
const FINISH_CHEER_SRC = "/audio/crowd_cheering.mp3";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playSound(src: string, volume = 0.75): void {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // Autoplay may be blocked until a user gesture; visual FX still run.
    });
  } catch {
    // Audio construction can fail in restricted environments.
  }
}

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

/** Triggers start flash on race start; confetti when the winner crosses (not when all finish). */
export function useRaceBookendFx(
  status: string,
  raceWon = false,
): {
  startFlash: boolean;
  finishConfetti: boolean;
} {
  const previousStatus = useRef(status);
  const [startFlash, setStartFlash] = useState(false);
  const [finishConfetti, setFinishConfetti] = useState(false);

  useEffect(() => {
    const prev = previousStatus.current;
    previousStatus.current = status;

    if (prev !== "running" && status === "running") {
      setStartFlash(true);
      if (!prefersReducedMotion()) {
        playSound(START_GUN_SRC, 0.85);
      }
      const timer = window.setTimeout(() => setStartFlash(false), 450);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [status]);

  useEffect(() => {
    if (!raceWon) {
      setFinishConfetti(false);
      return undefined;
    }

    setFinishConfetti(true);
    if (!prefersReducedMotion()) {
      playSound(FINISH_CHEER_SRC, 0.7);
      void fireFinishConfetti().catch(() => {
        // Canvas / WebGL may be unavailable.
      });
    }
    const timer = window.setTimeout(() => setFinishConfetti(false), 2800);
    return () => window.clearTimeout(timer);
  }, [raceWon]);

  return { startFlash, finishConfetti };
}

export function scrollTrackIntoView(element: HTMLElement | null): void {
  if (!element || typeof element.scrollIntoView !== "function") {
    return;
  }
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  element.scrollIntoView({ behavior, block: "start" });
}
