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
  trackFollowOnRaceCreated,
  trackPlaybackSpeed,
  trackRaceCompleted,
  trackRaceStarted,
  trackReplay,
  trackSharedRaceCompleted,
  trackSharedRaceStarted,
} from "./analytics";
import { formatLapLabel } from "./lapLabel";
import { RaceControls } from "./RaceControls";
import { RaceFinishConfetti, RaceStartFlash, prefersReducedMotion, scrollTrackIntoView, useRaceBookendFx } from "./RaceFx";
import { START_GUN_LEAD_MS } from "./raceAudio";
import { RESULT_REVEAL_DELAY_MS, resolveResultRevealDelayMs } from "./resultReveal";
import { ResultPanel } from "./ResultPanel";
import { SetupBottomSheet } from "./SetupBottomSheet";
import { SetupCard } from "./SetupCard";
import { SetupKeyboardGuard } from "./setupKeyboardGuard";
import { LANDSCAPE_RACE_ATTR, useLandscapeBand, useLandscapeFit } from "./landscapeFit";
import { RaceClockReadout, TrackStage } from "./TrackStage";
import { TrackRenderer } from "./TrackRenderer";
import { ghostAthletesFromSnapshot } from "./ghostFromSnapshot";
import {
  DEFAULT_DISTANCE_ID,
  PLACEHOLDER_ATHLETE_NAMES,
  canStartRace,
  createConfiguredRace,
  createDefaultAthleteDrafts,
  defaultTimesForDistance,
  parseRaceForm,
} from "./raceSession";
import type { AthleteDraft, RaceFormDraft } from "./raceSession";

const defaultLoopDependencies: RaceLoopDependencies = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
};

export type SharedWorkspaceConfig = {
  raceId: string;
  draft: RaceFormDraft;
  autoStart?: boolean;
};

export function RaceWorkspace({
  loopDependencies = defaultLoopDependencies,
  shared,
  challengePrefillName,
}: {
  loopDependencies?: RaceLoopDependencies;
  shared?: SharedWorkspaceConfig;
  challengePrefillName?: string;
} = {}) {
  const [distanceId, setDistanceId] = useState(
    shared?.draft.distanceId ?? DEFAULT_DISTANCE_ID,
  );
  const [athletes, setAthletes] = useState<[AthleteDraft, AthleteDraft]>(() => {
    if (shared?.draft.athletes) {
      return [
        { ...shared.draft.athletes[0] },
        { ...shared.draft.athletes[1] },
      ];
    }
    const defaults = createDefaultAthleteDrafts(DEFAULT_DISTANCE_ID);
    if (challengePrefillName) {
      return [
        defaults[0],
        { ...defaults[1], name: challengePrefillName },
      ];
    }
    return defaults;
  });
  const [telemetry, setTelemetry] = useState<RaceTelemetry | null>(null);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(DEFAULT_PLAYBACK_RATE);
  const [pendingStart, setPendingStart] = useState(false);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [setupSheetOpen, setSetupSheetOpen] = useState(false);
  const [sharedLocked, setSharedLocked] = useState(Boolean(shared));
  const landscapeFit = useLandscapeFit();
  const landscapeBand = useLandscapeBand();
  const sessionRef = useRef<ReturnType<typeof createRaceLoop> | null>(null);
  const completedRaceKeyRef = useRef<string | null>(null);
  const trackStageRef = useRef<HTMLElement | null>(null);
  const resultPanelRef = useRef<HTMLElement | null>(null);
  const startDelayRef = useRef<number | null>(null);
  const resultRevealTimerRef = useRef<number | null>(null);
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
  // Phone landscape + live race: track becomes the hero (chrome collapses via html attr).
  const landscapeRaceHero = landscapeBand === "sheet" && status !== "idle";
  const formLocked = status !== "idle" || pendingStart || sharedLocked;
  const startEnabled = status === "idle" && !pendingStart && canStartRace(draft);
  const showSetup = status === "idle" && !pendingStart && !sharedLocked;
  // One Start CTA: landscape sheet footer or under the setup form (all viewports).
  const startInSetupCard = showSetup && !landscapeFit;
  const hasResult = Boolean(telemetry?.result);
  const showResult = hasResult && resultsRevealed;
  const raceWon = Boolean(telemetry?.winnerSnapshot);
  const { startFlash, finishConfetti, triggerStartFx } = useRaceBookendFx(raceWon);
  const [setupEpoch, setSetupEpoch] = useState(showSetup);
  const [resultSeen, setResultSeen] = useState(hasResult);

  if (setupEpoch !== showSetup) {
    setSetupEpoch(showSetup);
    if (!showSetup && setupSheetOpen) {
      setSetupSheetOpen(false);
    }
  }

  if (resultSeen !== hasResult) {
    setResultSeen(hasResult);
    setResultsRevealed(hasResult && RESULT_REVEAL_DELAY_MS <= 0);
  }
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
      name:
        athlete.name.trim() ||
        PLACEHOLDER_ATHLETE_NAMES[athlete.id as keyof typeof PLACEHOLDER_ATHLETE_NAMES] ||
        athlete.id,
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
      if (resultRevealTimerRef.current !== null) {
        window.clearTimeout(resultRevealTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (landscapeRaceHero) {
      document.documentElement.setAttribute(LANDSCAPE_RACE_ATTR, "true");
    } else {
      document.documentElement.removeAttribute(LANDSCAPE_RACE_ATTR);
    }
    return () => {
      document.documentElement.removeAttribute(LANDSCAPE_RACE_ATTR);
    };
  }, [landscapeRaceHero]);

  const autoStartRef = useRef(false);

  useEffect(() => {
    if (!hasResult) {
      if (resultRevealTimerRef.current !== null) {
        window.clearTimeout(resultRevealTimerRef.current);
        resultRevealTimerRef.current = null;
      }
      return;
    }

    const delay = resolveResultRevealDelayMs(prefersReducedMotion());
    if (delay <= 0) {
      return;
    }

    resultRevealTimerRef.current = window.setTimeout(() => {
      resultRevealTimerRef.current = null;
      setResultsRevealed(true);
    }, delay);

    return () => {
      if (resultRevealTimerRef.current !== null) {
        window.clearTimeout(resultRevealTimerRef.current);
        resultRevealTimerRef.current = null;
      }
    };
  }, [hasResult]);

  useEffect(() => {
    if (!resultsRevealed) {
      return;
    }
    scrollTrackIntoView(resultPanelRef.current);
  }, [resultsRevealed]);

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
    if (shared?.raceId) {
      trackSharedRaceCompleted({
        ...analyticsRace,
        playbackRate,
        raceId: shared.raceId,
      });
    } else {
      trackRaceCompleted({ ...analyticsRace, playbackRate });
    }
  }, [analyticsRace, distanceId, playbackRate, shared?.raceId, status, telemetry?.result]);

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

  function clearResultReveal(): void {
    if (resultRevealTimerRef.current !== null) {
      window.clearTimeout(resultRevealTimerRef.current);
      resultRevealTimerRef.current = null;
    }
    setResultsRevealed(false);
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
    clearResultReveal();
    setPendingStart(true);
    completedRaceKeyRef.current = null;
    sessionRef.current?.reset();
    const loop = createRaceLoop(createConfiguredRace(parsed), setTelemetry, loopDependencies);
    sessionRef.current = loop;
    loop.setPlaybackRate(playbackRate);
    if (kind === "start") {
      if (shared?.raceId) {
        trackSharedRaceStarted({
          ...analyticsRace,
          playbackRate,
          raceId: shared.raceId,
        });
      } else {
        trackRaceStarted({ ...analyticsRace, playbackRate });
      }
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

  useEffect(() => {
    if (!shared?.autoStart || autoStartRef.current) {
      return;
    }
    if (!parsed || status !== "idle" || pendingStart) {
      return;
    }
    autoStartRef.current = true;
    const timer = window.setTimeout(() => {
      beginRace("start");
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot auto-start for shared watch
  }, [shared?.autoStart, parsed, status, pendingStart]);

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

  useEffect(() => {
    spaceActionRef.current = {
      status,
      startEnabled,
      start: handleStart,
      pause: handlePause,
      resume: handleResume,
    };
  });

  function handleReset(): void {
    clearStartDelay();
    clearResultReveal();
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

  function unlockForNewSetup(options?: { keepRivalName?: string }): void {
    clearStartDelay();
    clearResultReveal();
    sessionRef.current?.reset();
    sessionRef.current = null;
    setTelemetry(null);
    completedRaceKeyRef.current = null;
    setSharedLocked(false);
    const nextDistance = DEFAULT_DISTANCE_ID;
    const defaults = createDefaultAthleteDrafts(nextDistance);
    setDistanceId(nextDistance);
    setAthletes([
      defaults[0],
      {
        ...defaults[1],
        name: options?.keepRivalName ?? defaults[1].name,
      },
    ]);
  }

  function handleChallengeRival(): void {
    const rivalName = athletes[1]?.name?.trim() || athletes[0]?.name?.trim() || "";
    trackFollowOnRaceCreated({
      ...analyticsRace,
      sourceRaceId: shared?.raceId,
    });
    if (shared) {
      // Full navigation keeps shared-page client state from leaking into home.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- unit tests render without App Router
      window.location.assign(`/?challenge=${encodeURIComponent(rivalName)}`);
      return;
    }
    unlockForNewSetup({ keepRivalName: rivalName });
  }

  function handleCreateNewRace(): void {
    trackFollowOnRaceCreated({
      ...analyticsRace,
      sourceRaceId: shared?.raceId,
    });
    if (shared) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- unit tests render without App Router
      window.location.assign("/");
      return;
    }
    unlockForNewSetup();
  }

  const sharePayload =
    parsed && telemetry?.result
      ? {
          distanceId,
          distanceM,
          distanceLabel,
          nameA: parsed.athletes[0].name,
          nameB: parsed.athletes[1].name,
          finishTimeMsA: parsed.athletes[0].finishTimeMs,
          finishTimeMsB: parsed.athletes[1].finishTimeMs,
          sourceRaceId: shared?.raceId,
        }
      : undefined;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3">
      <p className="sr-only" data-testid="race-status" aria-live="polite">
        {status}
      </p>

      <div className="w-full min-w-0 shrink-0">
        <TrackStage
          stageRef={trackStageRef}
          landscapeBand={landscapeBand}
          raceHero={landscapeRaceHero}
          clock={
            <RaceClockReadout
              distanceLabel={distanceLabel}
              timeText={formatRaceTime(telemetry?.raceTimeMs ?? 0)}
              lapText={lapText}
              landscapeBand={landscapeBand}
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
            status !== "idle" ? (
              <RaceControls
                status={status}
                startEnabled={startEnabled}
                playbackRate={playbackRate}
                showStart={false}
                showSpeed
                layout={landscapeRaceHero ? "stack" : "row"}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onReset={handleReset}
                onPlaybackRate={handlePlaybackRate}
              />
            ) : undefined
          }
        />
      </div>

      {showSetup ? (
        <SetupKeyboardGuard>
          {landscapeFit ? (
            <SetupBottomSheet
              open={setupSheetOpen}
              onOpenChange={setSetupSheetOpen}
              footer={
                <button
                  type="button"
                  disabled={!startEnabled}
                  aria-label="Start race"
                  data-testid="setup-sheet-start"
                  onClick={handleStart}
                  className="ui-transition inline-flex min-h-11 min-w-[12rem] shrink-0 items-center justify-center gap-1.5 rounded-[var(--rmr-radius-control)] bg-brand-red px-5 py-2 font-display text-sm font-light uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[14rem] sm:tracking-[0.22em]"
                >
                  Start race
                  <span aria-hidden="true">▶</span>
                </button>
              }
            >
              <SetupCard
                distanceId={distanceId}
                athletes={athletes}
                formLocked={formLocked}
                onDistanceChange={handleDistanceChange}
                onAthleteChange={updateAthlete}
                onStart={handleStart}
              />
            </SetupBottomSheet>
          ) : (
            <SetupCard
              distanceId={distanceId}
              athletes={athletes}
              formLocked={formLocked}
              startEnabled={startEnabled}
              showStartButton={startInSetupCard}
              onDistanceChange={handleDistanceChange}
              onAthleteChange={updateAthlete}
              onStart={handleStart}
            />
          )}
        </SetupKeyboardGuard>
      ) : null}

      {showResult && telemetry?.result ? (
        <ResultPanel
          ref={resultPanelRef}
          result={telemetry.result}
          athletes={telemetry.athletes.map((athlete) => ({
            id: athlete.id,
            name: athlete.name,
            finishTimeMs: athlete.finishTimeMs,
          }))}
          sharePayload={sharePayload}
          onReplay={handleReplay}
          onChallengeRival={handleChallengeRival}
          onCreateNewRace={handleCreateNewRace}
        />
      ) : null}
    </div>
  );
}
