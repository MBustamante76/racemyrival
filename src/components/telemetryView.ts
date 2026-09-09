import { clamp, currentLeadM } from "@/domain/race";
import type { AthleteRaceState, RaceSnapshot } from "@/domain/race";

export interface TelemetryAthleteView {
  id: string;
  name: string;
  distanceM: number;
  speedMps: number;
  finished: boolean;
  finishTimeMs: number;
}

export interface TelemetryStripView {
  athletes: TelemetryAthleteView[];
  liveLeadM: number;
  displayLeadM: number;
  leaderId: string | null;
  leaderName: string | null;
  isTie: boolean;
}

export function displayDistanceM(distanceCoveredM: number, raceDistanceM: number): number {
  return clamp(distanceCoveredM, 0, raceDistanceM);
}

export function displaySpeedMps(athlete: Pick<AthleteRaceState, "speedMps">): number {
  return Number.isFinite(athlete.speedMps) ? athlete.speedMps : 0;
}

export function telemetryStripView(
  raceDistanceM: number,
  athletes: readonly AthleteRaceState[],
  winnerSnapshot: RaceSnapshot | null,
): TelemetryStripView {
  const views = athletes.map((athlete) => ({
    id: athlete.id,
    name: athlete.name,
    distanceM: displayDistanceM(athlete.distanceCoveredM, raceDistanceM),
    speedMps: displaySpeedMps(athlete),
    finished: athlete.finished,
    finishTimeMs: athlete.finishTimeMs,
  }));

  const liveLeadM = currentLeadM(views.map((athlete) => athlete.distanceM));
  const liveLeader = views.reduce<TelemetryAthleteView | null>((current, athlete) => {
    if (!current || athlete.distanceM > current.distanceM) {
      return athlete;
    }
    return current;
  }, null);
  const liveTie = views.length >= 2 && views[0].distanceM === views[1].distanceM;
  const snapshotLeader = winnerSnapshot?.winnerId
    ? views.find((athlete) => athlete.id === winnerSnapshot.winnerId) ?? null
    : null;
  const isTie = winnerSnapshot ? winnerSnapshot.winnerId === null : liveTie;
  const leader = winnerSnapshot ? snapshotLeader : liveLeader;
  const displayLeadM = winnerSnapshot ? winnerSnapshot.leadM : liveLeadM;

  return {
    athletes: views,
    liveLeadM,
    displayLeadM,
    leaderId: isTie ? null : leader?.id ?? null,
    leaderName: isTie ? null : leader?.name ?? null,
    isTie,
  };
}

function safeNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function formatMetres(distanceM: number): string {
  return `${safeNumber(distanceM).toFixed(1)}m`;
}

export function formatSpeedMps(speedMps: number): string {
  return `${safeNumber(speedMps).toFixed(2)} m/s`;
}

export function formatGapM(leadM: number): string {
  return `${safeNumber(leadM).toFixed(1)}m`;
}
