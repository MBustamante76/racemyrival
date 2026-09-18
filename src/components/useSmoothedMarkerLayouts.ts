"use client";

import { useEffect, useRef, useState } from "react";
import {
  blendLayoutsTowardTargets,
  labelLerpProgress,
  labelOffsetFromMarker,
  sidesSignature,
} from "./smoothMarkerLabels";
import type { AthleteMarkerLayout, LabelProximityState, ScreenPoint, TrackAthleteView } from "./trackView";
import { EMPTY_LABEL_PROXIMITY, layoutAthleteMarkers } from "./trackView";

/** Marker layouts with hysteresis/sticky close sides and smoothed label slides. */
export function useSmoothedMarkerLayouts(
  raceDistanceM: number,
  athletes: readonly TrackAthleteView[],
  laneOrderIds?: readonly string[],
): AthleteMarkerLayout[] {
  const proximityRef = useRef<LabelProximityState>(EMPTY_LABEL_PROXIMITY);
  const sideSigRef = useRef<string | null>(null);
  const fromOffsetsRef = useRef<Record<string, ScreenPoint>>({});
  const animStartRef = useRef(0);
  const displayRef = useRef<AthleteMarkerLayout[]>([]);
  const [, setFrame] = useState(0);

  const { layouts: targets, proximity } = layoutAthleteMarkers(
    raceDistanceM,
    athletes,
    proximityRef.current,
    laneOrderIds,
  );
  proximityRef.current = proximity;

  const nextSig = sidesSignature(targets);

  if (sideSigRef.current === null) {
    sideSigRef.current = nextSig;
    fromOffsetsRef.current = Object.fromEntries(
      targets.map((layout) => [layout.id, labelOffsetFromMarker(layout)]),
    );
    displayRef.current = [...targets];
  } else if (nextSig !== sideSigRef.current) {
    const previous = displayRef.current.length > 0 ? displayRef.current : targets;
    const nextFrom: Record<string, ScreenPoint> = {};
    for (const layout of previous) {
      nextFrom[layout.id] = labelOffsetFromMarker(layout);
    }
    for (const layout of targets) {
      if (!nextFrom[layout.id]) {
        nextFrom[layout.id] = labelOffsetFromMarker(layout);
      }
    }
    fromOffsetsRef.current = nextFrom;
    sideSigRef.current = nextSig;
    animStartRef.current = performance.now();
  }

  const now = typeof performance !== "undefined" ? performance.now() : 0;
  const progress = animStartRef.current === 0 ? 1 : labelLerpProgress(animStartRef.current, now);
  const blended = blendLayoutsTowardTargets(targets, fromOffsetsRef.current, progress);
  displayRef.current = blended;

  useEffect(() => {
    if (animStartRef.current === 0) {
      return;
    }
    let raf = 0;
    let alive = true;
    const tick = () => {
      if (!alive) {
        return;
      }
      setFrame((value) => value + 1);
      if (labelLerpProgress(animStartRef.current, performance.now()) < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    if (labelLerpProgress(animStartRef.current, performance.now()) < 1) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [nextSig]);

  return blended;
}
