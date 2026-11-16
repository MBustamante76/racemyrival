export const SHARED_RACE_SCHEMA_VERSION = 1 as const;
export const SIMULATION_VERSION = "rmr-pace-v1";

export const DISPLAY_NAME_MAX_LENGTH = 40;
export const FINISH_TIME_MS_MAX = 24 * 60 * 60 * 1000; // 24h sanity cap

export type SharedCompetitor = {
  displayName: string;
  finishTimeMs: number;
};

export type SharedRace = {
  id: string;
  schemaVersion: typeof SHARED_RACE_SCHEMA_VERSION;
  distanceId: string;
  distanceM: number;
  competitorA: SharedCompetitor;
  competitorB: SharedCompetitor;
  simulationVersion: string;
  campaignId: string | null;
  createdAt: string;
};

export type CreateSharedRaceInput = {
  distanceId: string;
  distanceM: number;
  competitorA: SharedCompetitor;
  competitorB: SharedCompetitor;
  campaignId?: string | null;
};
