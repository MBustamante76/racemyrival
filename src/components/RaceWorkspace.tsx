"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_PLAYBACK_RATE,
  formatRaceTime,
  raceDistanceById,
} from "@/domain/race";
import type { PlaybackRate, RaceStatus, RaceTelemetry } from "@/domain/race";
import { createRaceLoop } from "@/runtime/createRaceLoop";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import {
  trackPlaybackSpeed,
  trackRaceAgain,
  trackRaceCompleted,
  trackRaceStarted,
  trackReplay,
} from "./analytics";
import { formatLapLabel } from "./lapLabel";
import { RaceControls } from "./RaceControls";
import { RaceFinishConfetti, RaceStartFlash, scrollTrackIntoView, useRaceBookendFx } from "./RaceFx";
import { START_GUN_LEAD_MS } from "./raceAudio";
import { ResultPanel } from "./ResultPanel";
import { SetupCard } from "./SetupCard";
import { RaceClockReadout, TrackStage } from "./TrackStage";
import { TrackRenderer } from "./TrackRenderer";
import { ghostAthletesFromSnapshot } from "./ghostFromSnapshot";
import {
  DEFAULT_DISTANCE_ID,
  canStartRace,
  createConfiguredRace,
  createDefaultAthleteDrafts,
  defaultTimesForDistance,
  parseRaceForm,
} from "./raceSession";
import type { AthleteDraft } from "./raceSession";

const defaultLoopDependencies: RaceLoopDependencies = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
};

export function RaceWorkspace({
  loopDependencies = defaultLoopDependencies,
}: {
  loopDependencies?: RaceLoopDependencies;
} = {}) {
  const [distanceId, setDistanceId] = useState(DEFAULT_DISTANCE_ID);
  const [athletes, setAthletes] = useState<[AthleteDraft, AthleteDraft]>(() =>
    createDefaultAthleteDrafts(DEFAULT_DISTANCE_ID),
  );
  const [telemetry, setTelemetry] = useState<RaceTelemetry | null>(null);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(DEFAULT_PLAYBACK_RATE);
  const [pendingStart, setPendingStart] = useState(false);
  const sessionRef = useRef<ReturnType<typeof createRaceLoop> | null>(null);
  const completedRaceKeyRef = useRef<string | null>(null);
  const trackStageRef = useRef<HTMLElement | null>(null);
  const startDelayRef = useRef<number | null>(null);
  const spaceActionRef = useRef({
    status: "idle" as RaceStatus,
    startEnabled: false,
    start: () => {},
    pause: () => {},
    resume: () => {},
  });

  const draft = { distanceId, athletes };
  const parsed = parseRaceForm(draft);
  const distanceM = raceDistanceById(distanceId)?.distanceM ?? 800;
  const distanceLabel = raceDistanceById(distanceId)?.label ?? "800m";
  const analyticsRace = useMemo(() => ({ distanceId, distanceM }), [distanceId, distanceM]);
  const status: RaceStatus = telemetry?.status ?? "idle";
  const formLocked = status !== "idle" || pendingStart;
  const startEnabled = status === "idle" && !pendingStart && canStartRace(draft);
  const showSetup = status === "idle" && !pendingStart;
  const showResult = Boolean(telemetry?.result);
  const raceWon = Boolean(telemetry?.winnerSnapshot);
  const { startFlash, finishConfetti, triggerStartFx } = useRaceBookendFx(raceWon);
  const leader = telemetry?.athletes.reduce((current, athlete) =>
    athlete.distanceCoveredM > current.distanceCoveredM ? athlete : current,
  );
  const lapText = formatLapLabel(
    distanceM,
    leader?.completedLaps ?? 0,
    leader?.progress ?? 0,
  );

  const trackAthletes = useMemo(() => {
    if (telemetry) {
      return telemetry.athletes.map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        distanceCoveredM: athlete.distanceCoveredM,
      }));
    }

    return athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name.trim() || athlete.id,
      distanceCoveredM: 0,
    }));
  }, [athletes, telemetry]);

  const ghostAthletes = useMemo(
    () => ghostAthletesFromSnapshot(trackAthletes, telemetry?.winnerSnapshot ?? null),
    [trackAthletes, telemetry?.winnerSnapshot],
  );

  useEffect(() => {
    return () => {
      sessionRef.current?.reset();
      sessionRef.current = null;
      if (startDelayRef.current !== null) {
        window.clearTimeout(startDelayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onVisibilityChange(): void {
      sessionRef.current?.handleVisibility(
        document.visibilityState === "hidden" ? "hidden" : "visible",
      );
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      return target.isContentEditable;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.code !== "Space" && event.key !== " ") {
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      // Desktop shortcut (md+).
      if (typeof window.matchMedia === "function" && !window.matchMedia("(min-width: 768px)").matches) {
        return;
      }

      const action = spaceActionRef.current;
      event.preventDefault();
      if (action.status === "idle") {
        action.start();
        return;
      }
      if (action.status === "running") {
        action.pause();
        return;
      }
      if (action.status === "paused") {
        action.resume();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (status !== "finished" || !telemetry?.result) {
      return;
    }

    const key = `${distanceId}:${telemetry.result.winningTimeMs}:${telemetry.result.timeGapMs}`;
    if (completedRaceKeyRef.current === key) {
      return;
    }

    completedRaceKeyRef.current = key;
    trackRaceCompleted({ ...analyticsRace, playbackRate });
  }, [analyticsRace, distanceId, playbackRate, status, telemetry?.result]);

  function updateAthlete(index: 0 | 1, patch: Partial<AthleteDraft>): void {
    if (formLocked) {
      return;
    }

    setAthletes((current) => {
      const next: [AthleteDraft, AthleteDraft] = [{ ...current[0] }, { ...current[1] }];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function handleDistanceChange(nextDistanceId: string): void {
    if (formLocked) {
      return;
    }
    const [timeA, timeB] = defaultTimesForDistance(nextDistanceId);
    setDistanceId(nextDistanceId);
    setAthletes((current) => [
      { ...current[0], time: timeA },
      { ...current[1], time: timeB },
    ]);
  }

  function focusTrack(): void {
    scrollTrackIntoView(trackStageRef.current);
  }

  function clearStartDelay(): void {
    if (startDelayRef.current !== null) {
      window.clearTimeout(startDelayRef.current);
      startDelayRef.current = null;
    }
    setPendingStart(false);
  }

  function beginRace(kind: "start" | "replay"): void {
    if (!parsed) {
      return;
    }

    clearStartDelay();
    setPendingStart(true);
    completedRaceKeyRef.current = null;
    sessionRef.current?.reset();
    const loop = createRaceLoop(createConfiguredRace(parsed), setTelemetry, loopDependencies);
    sessionRef.current = loop;
    loop.setPlaybackRate(playbackRate);
    if (kind === "start") {
      trackRaceStarted({ ...analyticsRace, playbackRate });
    } else {
      trackReplay(analyticsRace);
    }
    triggerStartFx();
    focusTrack();
    if (START_GUN_LEAD_MS <= 0) {
      loop.start();
      setPendingStart(false);
      return;
    }
    startDelayRef.current = window.setTimeout(() => {
      startDelayRef.current = null;
      if (sessionRef.current !== loop) {
        setPendingStart(false);
        return;
      }
      loop.start();
      setPendingStart(false);
    }, START_GUN_LEAD_MS);
  }

  function handleStart(): void {
    if (!startEnabled || !parsed) {
      return;
    }
    beginRace("start");
  }

  function handlePlaybackRate(rate: PlaybackRate): void {
    setPlaybackRate(rate);
    sessionRef.current?.setPlaybackRate(rate);
    trackPlaybackSpeed({ playbackRate: rate, distanceId });
  }

  function handlePause(): void {
    sessionRef.current?.pause();
  }

  function handleResume(): void {
    sessionRef.current?.resume();
  }

  spaceActionRef.current = {
    status,
    startEnabled,
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
  };

  function handleReset(): void {
    clearStartDelay();
    sessionRef.current?.reset();
    sessionRef.current = null;
    setTelemetry(null);
    completedRaceKeyRef.current = null;
  }

  function handleReplay(): void {
    if (!parsed) {
      return;
    }
    beginRace("replay");
  }

  function handleRaceAgain(): void {
    clearStartDelay();
    sessionRef.current?.reset();
    sessionRef.current = null;
    setTelemetry(null);
    completedRaceKeyRef.current = null;
    trackRaceAgain(analyticsRace);
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3">
      <p className="sr-only" data-testid="race-status" aria-live="polite">
        {status}
      </p>

      <div className="w-full min-w-0 shrink-0">
        <TrackStage
          stageRef={trackStageRef}
          clock={
            <RaceClockReadout
              distanceLabel={distanceLabel}
              timeText={formatRaceTime(telemetry?.raceTimeMs ?? 0)}
              lapText={lapText}
            />
          }
          track={
            <TrackRenderer
              raceDistanceM={distanceM}
              athletes={trackAthletes}
              ghosts={ghostAthletes}
            />
          }
          overlay={
            <>
              <RaceStartFlash active={startFlash} />
              <RaceFinishConfetti active={finishConfetti} />
            </>
          }
          controls={
            <RaceControls
              status={status}
              startEnabled={startEnabled}
              playbackRate={playbackRate}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              onPlaybackRate={handlePlaybackRate}
            />
          }
        />
      </div>

      {showSetup ? (
        <SetupCard
          distanceId={distanceId}
          athletes={athletes}
          formLocked={formLocked}
          onDistanceChange={handleDistanceChange}
          onAthleteChange={updateAthlete}
          onStart={handleStart}
        />
      ) : null}

      {showResult && telemetry?.result ? (
        <ResultPanel
          result={telemetry.result}
          athletes={telemetry.athletes.map((athlete) => ({
            id: athlete.id,
            name: athlete.name,
            finishTimeMs: athlete.finishTimeMs,
          }))}
          onReplay={handleReplay}
          onRaceAgain={handleRaceAgain}
        />
      ) : null}
    </div>
  );
}
