import { Redis } from "@upstash/redis";
import type { SharedRace } from "./types";

type GlobalSharedRaceStore = {
  __rmrSharedRaces?: Map<string, SharedRace>;
};

/**
 * Use globalThis so API routes and RSC pages share one Map in Next.js dev
 * (module instances are otherwise isolated). Production should use Redis.
 */
function getMemoryStore(): Map<string, SharedRace> {
  const globalStore = globalThis as typeof globalThis & GlobalSharedRaceStore;
  if (!globalStore.__rmrSharedRaces) {
    globalStore.__rmrSharedRaces = new Map();
  }
  return globalStore.__rmrSharedRaces;
}

export function raceKey(id: string): string {
  return `race:${id}`;
}

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getRedis(): Redis | null {
  if (!redisConfigured()) {
    return null;
  }
  return Redis.fromEnv();
}

function ttlSeconds(): number | undefined {
  const raw = process.env.SHARED_RACE_TTL_SECONDS;
  if (raw === undefined || raw === "") {
    // Default 90 days when Redis is used.
    return 90 * 24 * 60 * 60;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

/** Test helper — clears the in-memory fallback store. */
export function clearMemorySharedRaceStore(): void {
  getMemoryStore().clear();
}

export async function putSharedRace(race: SharedRace): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    getMemoryStore().set(race.id, race);
    return;
  }
  const key = raceKey(race.id);
  const ttl = ttlSeconds();
  if (ttl) {
    await redis.set(key, race, { ex: ttl });
  } else {
    await redis.set(key, race);
  }
}

export async function getSharedRace(id: string): Promise<SharedRace | null> {
  const redis = getRedis();
  if (!redis) {
    return getMemoryStore().get(id) ?? null;
  }
  const value = await redis.get<SharedRace>(raceKey(id));
  if (!value) {
    return null;
  }
  return value;
}

export async function deleteSharedRace(id: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return getMemoryStore().delete(id);
  }
  const removed = await redis.del(raceKey(id));
  return removed > 0;
}

export function usingMemorySharedRaceStore(): boolean {
  return !redisConfigured();
}
