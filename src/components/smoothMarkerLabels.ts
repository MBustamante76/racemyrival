import type { AthleteMarkerLayout, ScreenPoint } from "./trackView";
import { LABEL_LERP_MS, svgNumber } from "./trackView";

export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 3;
}

export function lerpNumber(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function labelOffsetFromMarker(layout: Pick<AthleteMarkerLayout, "marker" | "label">): ScreenPoint {
  return {
    x: layout.label.x - layout.marker.x,
    y: layout.label.y - layout.marker.y,
  };
}

export function labelFromMarkerOffset(marker: ScreenPoint, offset: ScreenPoint): ScreenPoint {
  return {
    x: svgNumber(marker.x + offset.x),
    y: svgNumber(marker.y + offset.y),
  };
}

/** Blend label offsets so pins track live while labels slide between placements. */
export function blendLayoutsTowardTargets(
  targets: readonly AthleteMarkerLayout[],
  fromOffsets: Readonly<Record<string, ScreenPoint>>,
  progress: number,
): AthleteMarkerLayout[] {
  const t = easeOutCubic(progress);
  return targets.map((target) => {
    const from = fromOffsets[target.id] ?? labelOffsetFromMarker(target);
    const to = labelOffsetFromMarker(target);
    const offset = {
      x: lerpNumber(from.x, to.x, t),
      y: lerpNumber(from.y, to.y, t),
    };
    return {
      ...target,
      label: labelFromMarkerOffset(target.marker, offset),
    };
  });
}

export function sidesSignature(layouts: readonly AthleteMarkerLayout[]): string {
  return layouts.map((layout) => `${layout.id}:${layout.labelSide}`).join("|");
}

export function labelLerpProgress(startedAtMs: number, nowMs: number, durationMs = LABEL_LERP_MS): number {
  if (durationMs <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, (nowMs - startedAtMs) / durationMs));
}
