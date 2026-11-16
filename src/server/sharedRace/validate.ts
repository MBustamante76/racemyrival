import { raceDistanceById } from "@/domain/race";
import {
  DISPLAY_NAME_MAX_LENGTH,
  FINISH_TIME_MS_MAX,
  type CreateSharedRaceInput,
  type SharedCompetitor,
} from "./types";

export type ValidationFailure = {
  ok: false;
  error: string;
  field?: string;
};

export type ValidationSuccess = {
  ok: true;
  value: CreateSharedRaceInput;
};

export type ValidationResult = ValidationFailure | ValidationSuccess;

function sanitizeDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const stripped = raw.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
  if (stripped.length === 0 || stripped.length > DISPLAY_NAME_MAX_LENGTH) {
    return null;
  }
  if (!/[\p{L}\p{N}]/u.test(stripped)) {
    return null;
  }
  return stripped;
}

function parseCompetitor(
  raw: unknown,
  field: string,
): { ok: true; value: SharedCompetitor } | ValidationFailure {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid competitor", field };
  }
  const record = raw as Record<string, unknown>;
  const displayName = sanitizeDisplayName(record.displayName);
  if (!displayName) {
    return { ok: false, error: "Invalid display name", field: `${field}.displayName` };
  }
  const finishTimeMs = record.finishTimeMs;
  if (
    typeof finishTimeMs !== "number" ||
    !Number.isFinite(finishTimeMs) ||
    finishTimeMs <= 0 ||
    finishTimeMs > FINISH_TIME_MS_MAX
  ) {
    return { ok: false, error: "Invalid finish time", field: `${field}.finishTimeMs` };
  }
  return {
    ok: true,
    value: {
      displayName,
      finishTimeMs: Math.round(finishTimeMs),
    },
  };
}

export function validateCreateSharedRaceInput(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const record = body as Record<string, unknown>;
  const distanceId = typeof record.distanceId === "string" ? record.distanceId.trim() : "";
  const distance = raceDistanceById(distanceId);
  if (!distance) {
    return { ok: false, error: "Unsupported distance", field: "distanceId" };
  }
  if (typeof record.distanceM !== "number" || record.distanceM !== distance.distanceM) {
    return { ok: false, error: "Distance mismatch", field: "distanceM" };
  }

  const competitorA = parseCompetitor(record.competitorA, "competitorA");
  if (!competitorA.ok) {
    return competitorA;
  }
  const competitorB = parseCompetitor(record.competitorB, "competitorB");
  if (!competitorB.ok) {
    return competitorB;
  }

  let campaignId: string | null = null;
  if (record.campaignId !== undefined && record.campaignId !== null) {
    if (typeof record.campaignId !== "string" || record.campaignId.length > 64) {
      return { ok: false, error: "Invalid campaign id", field: "campaignId" };
    }
    campaignId = record.campaignId.trim() || null;
  }

  return {
    ok: true,
    value: {
      distanceId: distance.id,
      distanceM: distance.distanceM,
      competitorA: competitorA.value,
      competitorB: competitorB.value,
      campaignId,
    },
  };
}

export function isOpaqueRaceId(id: string): boolean {
  return /^[A-Za-z0-9_-]{21}$/.test(id);
}
