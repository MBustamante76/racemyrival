import type { RaceSimulation } from "../domain/race/RaceSimulation";
import type { RaceTelemetry } from "../domain/race/types";

export type FrameRequest = (callback: (time: number) => void) => number;
export type FrameCancel = (handle: number) => void;
export type VisibilityState = "visible" | "hidden";

export interface RaceLoopDependencies {
  now: () => number;
  requestFrame: FrameRequest;
  cancelFrame: FrameCancel;
}

export function createRaceLoop(
  simulation: RaceSimulation,
  onFrame: (telemetry: RaceTelemetry) => void,
  dependencies: RaceLoopDependencies,
) {
  let frameHandle: number | null = null;

  function schedule(): void {
    if (frameHandle !== null) {
      return;
    }

    frameHandle = dependencies.requestFrame(() => {
      frameHandle = null;
      const telemetry = simulation.tick(dependencies.now());
      onFrame(telemetry);
      if (telemetry.status === "running") {
        schedule();
      }
    });
  }

  function stopFrames(): void {
    if (frameHandle !== null) {
      dependencies.cancelFrame(frameHandle);
      frameHandle = null;
    }
  }

  return {
    start(): RaceTelemetry {
      const telemetry = simulation.start(dependencies.now());
      onFrame(telemetry);
      schedule();
      return telemetry;
    },
    pause(): RaceTelemetry {
      stopFrames();
      const telemetry = simulation.pause();
      onFrame(telemetry);
      return telemetry;
    },
    resume(): RaceTelemetry {
      const telemetry = simulation.resume(dependencies.now());
      onFrame(telemetry);
      schedule();
      return telemetry;
    },
    reset(): RaceTelemetry {
      stopFrames();
      const telemetry = simulation.reset();
      onFrame(telemetry);
      return telemetry;
    },
    handleVisibility(state: VisibilityState): void {
      if (state === "hidden" && simulation.telemetry().status === "running") {
        this.pause();
      }
    },
  };
}
