import type { PaceModel } from "./types";

export class ConstantPaceModel implements PaceModel {
  constructor(
    readonly totalDistanceM: number,
    readonly finishTimeMs: number,
  ) {}

  speedAt(): number {
    return this.totalDistanceM / (this.finishTimeMs / 1000);
  }

  distanceAt(elapsedMs: number): number {
    if (elapsedMs <= 0) {
      return 0;
    }

    const distanceM = this.speedAt() * (elapsedMs / 1000);
    return Math.min(this.totalDistanceM, distanceM);
  }
}
