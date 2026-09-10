import { CANONICAL_LAP_M } from "@/domain/race";

export function formatLapLabel(
  distanceM: number,
  completedLaps: number,
  progress: number,
): string {
  const currentLap = Math.min(
    Math.max(1, completedLaps + (progress >= 1 ? 0 : 1)),
    Math.max(1, Math.ceil(distanceM / CANONICAL_LAP_M)),
  );
  const totalLaps = Math.max(1, Math.round(distanceM / CANONICAL_LAP_M));

  if (distanceM % CANONICAL_LAP_M === 0) {
    return `LAP ${currentLap} OF ${totalLaps}`;
  }

  return `LAP ${currentLap} · ${Math.round(progress * 100)}%`;
}
