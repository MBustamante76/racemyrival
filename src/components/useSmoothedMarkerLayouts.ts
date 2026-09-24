"use client";

import { useEffect, useState } from "react";
import {
  blendLayoutsTowardTargets,
  labelLerpProgress,
  labelOffsetFromMarker,
  sidesSignature,
} from "./smoothMarkerLabels";
import type { AthleteMarkerLayout, LabelProximityState, ScreenPoint, TrackAthleteView } from "./trackView";
import { EMPTY_LABEL_PROXIMITY, layoutAthleteMarkers } from "./trackView";

function offsetsFrom(layouts: readonly AthleteMarkerLayout[]): Record<string, ScreenPoint> {
  return Object.fromEntries(layouts.map((layout) => [layout.id, labelOffsetFromMarker(layout)]));
}

function mergeOffsets(
  previous: readonly AthleteMarkerLayout[],
  targets: readonly AthleteMarkerLayout[],
): Record<string, ScreenPoint> {
  const nextFrom: Record<string, ScreenPoint> = {};
  for (const layout of previous) {
    nextFrom[layout.id] = labelOffsetFromMarker(layout);
  }
  for (const layout of targets) {
    if (!nextFrom[layout.id]) {
      nextFrom[layout.id] = labelOffsetFromMarker(layout);
    }
  }
  return nextFrom;
}

function proximityKey(state: LabelProximityState): string {
  if (!state.closeMode) {
    return "open";
  }
  return `close:${Object.entries(state.closeSides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, side]) => `${id}:${side}`)
    .join("|")}`;
}

function targetsKey(layouts: readonly AthleteMarkerLayout[]): string {
  return layouts.map((layout) => `${layout.id}:${layout.labelSide}:${layout.label.x}:${layout.label.y}`).join("|");
}

/** Marker layouts with hysteresis/sticky close sides and smoothed label slides. */
export function useSmoothedMarkerLayouts(
  raceDistanceM: number,
  athletes: readonly TrackAthleteView[],
  laneOrderIds?: readonly string[],
): AthleteMarkerLayout[] {
  const [proximity, setProximity] = useState<LabelProximityState>(EMPTY_LABEL_PROXIMITY);
  const [committed, setCommitted] = useState<{
    sig: string;
    key: string;
    targets: AthleteMarkerLayout[];
  } | null>(null);
  const [fromOffsets, setFromOffsets] = useState<Record<string, ScreenPoint>>({});
  const [animStart, setAnimStart] = useState(0);
  const [nowMs, setNowMs] = useState(0);

  const { layouts: targets, proximity: nextProximity } = layoutAthleteMarkers(
    raceDistanceM,
    athletes,
    proximity,
    laneOrderIds,
  );
  const nextSig = sidesSignature(targets);
  const nextKey = targetsKey(targets);

  if (proximityKey(proximity) !== proximityKey(nextProximity)) {
    setProximity(nextProximity);
  }

  if (committed === null) {
    setCommitted({ sig: nextSig, key: nextKey, targets });
    setFromOffsets(offsetsFrom(targets));
  } else if (committed.sig !== nextSig) {
    setFromOffsets(mergeOffsets(committed.targets, targets));
    setCommitted({ sig: nextSig, key: nextKey, targets });
    setAnimStart(-1);
    setNowMs(0);
  } else if (committed.key !== nextKey) {
    setCommitted({ sig: nextSig, key: nextKey, targets });
  }

  const progress = animStart <= 0 ? (animStart === -1 ? 0 : 1) : labelLerpProgress(animStart, nowMs);
  const blended = blendLayoutsTowardTargets(targets, fromOffsets, progress);

  useEffect(() => {
    if (animStart !== -1) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const started = performance.now();
      setAnimStart(started);
      setNowMs(started);
    });
    return () => cancelAnimationFrame(raf);
  }, [animStart]);

  useEffect(() => {
    if (animStart <= 0) {
      return;
    }
    let raf = 0;
    let alive = true;
    const tick = (): void => {
      if (!alive) {
        return;
      }
      const now = performance.now();
      setNowMs(now);
      if (labelLerpProgress(animStart, now) < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [animStart]);

  return blended;
}
