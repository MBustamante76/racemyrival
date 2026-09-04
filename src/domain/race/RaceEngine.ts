import { assertTwoAthletes } from "./athletes";
import { deriveAthleteState } from "./calculations";
import { raceResultFromPaceModels } from "./result";
import type {
  AthletePaceBinding,
  PaceModel,
  RaceConfiguration,
  RaceResult,
  RaceStatus,
  RaceTelemetry,
} from "./types";

export class RaceEngine {
  private readonly bindings: AthletePaceBinding[];

  constructor(
    private readonly configuration: RaceConfiguration,
    paces: readonly PaceModel[],
  ) {
    const athletes = assertTwoAthletes(configuration.athletes);
    if (paces.length !== athletes.length) {
      throw new Error("Each athlete must have a PaceModel");
    }

    this.bindings = athletes.map((athlete, index) => ({
      id: athlete.id,
      pace: paces[index],
    }));
  }

  telemetryAt(elapsedMs: number): RaceTelemetry {
    const athletes = this.configuration.athletes.map((athlete, index) =>
      deriveAthleteState(athlete, this.bindings[index].pace, elapsedMs),
    );

    return {
      raceTimeMs: Math.max(0, elapsedMs),
      status: raceStatusFromAthletes(elapsedMs, athletes),
      athletes,
    };
  }

  result(): RaceResult {
    return raceResultFromPaceModels(this.bindings);
  }
}

function raceStatusFromAthletes(
  elapsedMs: number,
  athletes: RaceTelemetry["athletes"],
): RaceStatus {
  if (athletes.every((athlete) => athlete.finished)) {
    return "finished";
  }

  if (elapsedMs <= 0) {
    return "idle";
  }

  return "running";
}
