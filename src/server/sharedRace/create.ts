import { nanoid } from "nanoid";
import { putSharedRace } from "./store";
import {
  SHARED_RACE_SCHEMA_VERSION,
  SIMULATION_VERSION,
  type CreateSharedRaceInput,
  type SharedRace,
} from "./types";

export async function createSharedRace(input: CreateSharedRaceInput): Promise<SharedRace> {
  const race: SharedRace = {
    id: nanoid(21),
    schemaVersion: SHARED_RACE_SCHEMA_VERSION,
    distanceId: input.distanceId,
    distanceM: input.distanceM,
    competitorA: input.competitorA,
    competitorB: input.competitorB,
    simulationVersion: SIMULATION_VERSION,
    campaignId: input.campaignId ?? null,
    createdAt: new Date().toISOString(),
  };
  await putSharedRace(race);
  return race;
}
