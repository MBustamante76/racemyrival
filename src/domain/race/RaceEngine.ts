import { assertTwoAthletes } from "./athletes";
import { deriveAthleteState, firstFinishTimeMs } from "./calculations";
import { raceResultFromPaceModels } from "./result";
import type {
  AthletePaceBinding,
  PaceModel,
  RaceConfiguration,
  RaceResult,
  RaceSnapshot,
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
    const elapsed = Math.max(0, elapsedMs);
    const athletes = this.configuration.athletes.map((athlete, index) =>
      deriveAthleteState(athlete, this.bindings[index].pace, elapsed),
    );
    const projected = this.result();
    const firstFinishMs = projected.winningTimeMs;
    const allFinished = athletes.every((athlete) => athlete.finished);
    const raceTimeMs = allFinished ? this.lastFinishTimeMs() : elapsed;

    return {
      raceTimeMs,
      status: raceStatusFromAthletes(elapsed, athletes),
      athletes,
      winnerSnapshot: elapsed >= firstFinishMs ? freezeSnapshot(projected.snapshot) : null,
      result: allFinished ? projected : null,
    };
  }

  result(): RaceResult {
    return raceResultFromPaceModels(this.bindings);
  }

  firstFinishTimeMs(): number {
    return Math.min(...this.bindings.map((binding) => firstFinishTimeMs(binding.pace)));
  }

  lastFinishTimeMs(): number {
    return Math.max(...this.bindings.map((binding) => firstFinishTimeMs(binding.pace)));
  }
}

function freezeSnapshot(snapshot: RaceSnapshot): RaceSnapshot {
  return {
    raceTimeMs: snapshot.raceTimeMs,
    leadM: snapshot.leadM,
    winnerId: snapshot.winnerId,
    athletes: snapshot.athletes.map((athlete) => ({ ...athlete })),
  };
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
