"use client";

import { useEffect, useRef, useState } from "react";
import { fireFinishConfetti } from "./finishConfettiBurst";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playTone(frequencyHz: number, durationMs: number, gain = 0.08): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequencyHz;
    amp.gain.value = gain;
    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start();
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
    window.setTimeout(() => {
      void ctx.close();
    }, durationMs + 50);
  } catch {
    // Autoplay or AudioContext may be blocked; visual FX still run.
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

/** Finish celebration via @tsparticles/confetti (confetti.js.org), scoped to the track stage. */
export function RaceFinishConfetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (cancelled || !canvas.isConnected) {
          return;
        }
        await fireFinishConfetti(canvas);
      } catch {
        // Canvas / WebGL may be unavailable (tests, blocked contexts).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="race-finish-confetti"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

/** Triggers brief start/finish FX from race status transitions. */
export function useRaceBookendFx(status: string): {
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
        playTone(180, 120, 0.1);
      }
      const timer = window.setTimeout(() => setStartFlash(false), 450);
      return () => window.clearTimeout(timer);
    }

    if (prev !== "finished" && status === "finished") {
      setFinishConfetti(true);
      if (!prefersReducedMotion()) {
        playTone(520, 90, 0.06);
        window.setTimeout(() => playTone(660, 120, 0.05), 100);
      }
      const timer = window.setTimeout(() => setFinishConfetti(false), 2800);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [status]);

  return { startFlash, finishConfetti };
}

export function scrollTrackIntoView(element: HTMLElement | null): void {
  if (!element || typeof element.scrollIntoView !== "function") {
    return;
  }
  const behavior = prefersReducedMotion() ? "auto" : "smooth";
  element.scrollIntoView({ behavior, block: "start" });
}
