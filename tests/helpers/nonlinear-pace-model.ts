import type { PaceCheckpoint, PaceModel } from "@/domain/race";

export class NonlinearPaceModel implements PaceModel {
  constructor(
    private readonly checkpoints: readonly PaceCheckpoint[],
    readonly finishTimeMs: number,
  ) {}

  get totalDistanceM(): number {
    return this.checkpoints[this.checkpoints.length - 1]?.distanceM ?? 0;
  }

  distanceAt(elapsedMs: number): number {
    if (elapsedMs <= 0 || this.checkpoints.length === 0) {
      return 0;
    }

    const last = this.checkpoints[this.checkpoints.length - 1];
    if (elapsedMs >= last.elapsedMs) {
      return last.distanceM;
    }

    let previous = this.checkpoints[0];
    for (const current of this.checkpoints) {
      if (elapsedMs === current.elapsedMs) {
        return current.distanceM;
      }

      if (elapsedMs < current.elapsedMs) {
        const spanMs = current.elapsedMs - previous.elapsedMs;
        if (spanMs <= 0) {
          return current.distanceM;
        }

        const progress = (elapsedMs - previous.elapsedMs) / spanMs;
        return previous.distanceM + (current.distanceM - previous.distanceM) * progress;
      }

      previous = current;
    }

    return last.distanceM;
  }
}
