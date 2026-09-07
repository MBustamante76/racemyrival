import { DEFAULT_PLAYBACK_RATE, MAX_FRAME_DELTA_MS } from "./constants";
import type { RaceStatus } from "./types";

export type WallTimeMs = number;

export class RaceClock {
  private status: RaceStatus = "idle";
  private elapsedMs = 0;
  private lastWallMs: number | null = null;
  private playbackRate = DEFAULT_PLAYBACK_RATE;

  constructor(private readonly maxFrameDeltaMs: number = MAX_FRAME_DELTA_MS) {}

  getStatus(): RaceStatus {
    return this.status;
  }

  getElapsedMs(): number {
    return this.elapsedMs;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  setPlaybackRate(rate: number): void {
    if (rate > 0 && Number.isFinite(rate)) {
      this.playbackRate = rate;
    }
  }

  start(wallMs: number): void {
    this.elapsedMs = 0;
    this.lastWallMs = wallMs;
    this.status = "running";
  }

  pause(): void {
    if (this.status !== "running") {
      return;
    }

    this.status = "paused";
    this.lastWallMs = null;
  }

  resume(wallMs: number): void {
    if (this.status !== "paused") {
      return;
    }

    this.status = "running";
    this.lastWallMs = wallMs;
  }

  reset(): void {
    this.status = "idle";
    this.elapsedMs = 0;
    this.lastWallMs = null;
  }

  markFinished(): void {
    this.status = "finished";
    this.lastWallMs = null;
  }

  tick(wallMs: number): number {
    if (this.status !== "running") {
      return this.elapsedMs;
    }

    const previousWallMs = this.lastWallMs ?? wallMs;
    const rawDeltaMs = wallMs - previousWallMs;
    const deltaMs = Math.min(Math.max(0, rawDeltaMs), this.maxFrameDeltaMs);
    this.elapsedMs = Math.max(0, this.elapsedMs + deltaMs * this.playbackRate);
    this.lastWallMs = wallMs;
    return this.elapsedMs;
  }
}
