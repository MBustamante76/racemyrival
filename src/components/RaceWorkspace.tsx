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
import { formatLapLabel } from "./lapLabel";
import { ResultPanel } from "./ResultPanel";
import { SetupCard } from "./SetupCard";
import { TelemetryStrip } from "./TelemetryStrip";
import { RaceClockReadout, TrackStage } from "./TrackStage";
import { TrackRenderer } from "./TrackRenderer";
import { ghostAthletesFromSnapshot } from "./ghostFromSnapshot";
import {
  DEFAULT_ATHLETE_DRAFTS,
  DEFAULT_DISTANCE_ID,
  canStartRace,
  createConfiguredRace,
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
  const [athletes, setAthletes] = useState<[AthleteDraft, AthleteDraft]>([
    { ...DEFAULT_ATHLETE_DRAFTS[0] },
    { ...DEFAULT_ATHLETE_DRAFTS[1] },
  ]);
  const [telemetry, setTelemetry] = useState<RaceTelemetry | null>(null);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(DEFAULT_PLAYBACK_RATE);
  const sessionRef = useRef<ReturnType<typeof createRaceLoop> | null>(null);

  const draft = { distanceId, athletes };
  const parsed = parseRaceForm(draft);
  const distanceM = raceDistanceById(distanceId)?.distanceM ?? 800;
  const status: RaceStatus = telemetry?.status ?? "idle";
  const formLocked = status !== "idle";
  const startEnabled = status === "idle" && canStartRace(draft);
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

  function handleStart(): void {
    if (!startEnabled || !parsed) {
      return;
    }

    sessionRef.current?.reset();
    const loop = createRaceLoop(createConfiguredRace(parsed), setTelemetry, loopDependencies);
    sessionRef.current = loop;
    loop.setPlaybackRate(playbackRate);
    loop.start();
  }

  function handlePlaybackRate(rate: PlaybackRate): void {
    setPlaybackRate(rate);
    sessionRef.current?.setPlaybackRate(rate);
  }

  function handlePause(): void {
    sessionRef.current?.pause();
  }

  function handleResume(): void {
    sessionRef.current?.resume();
  }

  function handleReset(): void {
    sessionRef.current?.reset();
    sessionRef.current = null;
    setTelemetry(null);
  }

  function handleReplay(): void {
    if (!parsed) {
      return;
    }

    sessionRef.current?.reset();
    const loop = createRaceLoop(createConfiguredRace(parsed), setTelemetry, loopDependencies);
    sessionRef.current = loop;
    loop.setPlaybackRate(playbackRate);
    loop.start();
  }

  function handleRaceAgain(): void {
    sessionRef.current?.reset();
    sessionRef.current = null;
    setTelemetry(null);
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:gap-4">
      <SetupCard
        distanceId={distanceId}
        athletes={athletes}
        status={status}
        formLocked={formLocked}
        startEnabled={startEnabled}
        playbackRate={playbackRate}
        onDistanceChange={setDistanceId}
        onAthleteChange={updateAthlete}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onPlaybackRate={handlePlaybackRate}
      />

      <p className="sr-only" data-testid="race-status" aria-live="polite">
        {status}
      </p>

      <TrackStage
        clock={
          <RaceClockReadout
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
      />

      <TelemetryStrip
        raceDistanceM={distanceM}
        athletes={telemetry?.athletes}
        drafts={athletes}
        winnerSnapshot={telemetry?.winnerSnapshot ?? null}
      />

      {telemetry?.result ? (
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
