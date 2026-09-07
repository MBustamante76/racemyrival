import { RaceClock } from "./RaceClock";
import { RaceEngine } from "./RaceEngine";
import type { RaceStatus, RaceTelemetry } from "./types";

export class RaceSimulation {
  constructor(
    private readonly engine: RaceEngine,
    private readonly clock: RaceClock,
  ) {}

  start(wallMs: number): RaceTelemetry {
    this.clock.start(wallMs);
    return this.telemetry();
  }

  pause(): RaceTelemetry {
    this.clock.pause();
    return this.telemetry();
  }

  resume(wallMs: number): RaceTelemetry {
    this.clock.resume(wallMs);
    return this.telemetry();
  }

  reset(): RaceTelemetry {
    this.clock.reset();
    return this.telemetry();
  }

  tick(wallMs: number): RaceTelemetry {
    this.clock.tick(wallMs);
    const telemetry = this.telemetry();
    if (telemetry.status === "finished") {
      this.clock.markFinished();
    }
    return this.telemetry();
  }

  telemetry(): RaceTelemetry {
    const derived = this.engine.telemetryAt(this.clock.getElapsedMs());
    return {
      ...derived,
      status: composeStatus(this.clock.getStatus(), derived.status),
    };
  }
}

function composeStatus(clockStatus: RaceStatus, derivedStatus: RaceStatus): RaceStatus {
  if (clockStatus === "paused") {
    return "paused";
  }

  if (derivedStatus === "finished") {
    return "finished";
  }

  return clockStatus;
}
