"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RACE_DISTANCES,
  formatRaceTime,
  raceDistanceById,
} from "@/domain/race";
import type { AthleteRaceState, RaceStatus, RaceTelemetry } from "@/domain/race";
import { createRaceLoop } from "@/runtime/createRaceLoop";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { TrackRenderer } from "./TrackRenderer";
import {
  DEFAULT_ATHLETE_DRAFTS,
  DEFAULT_DISTANCE_ID,
  canStartRace,
  createConfiguredRace,
  nameFieldError,
  parseRaceForm,
  timeFieldError,
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
  const sessionRef = useRef<ReturnType<typeof createRaceLoop> | null>(null);

  const draft = { distanceId, athletes };
  const parsed = parseRaceForm(draft);
  const distanceM = raceDistanceById(distanceId)?.distanceM ?? 800;
  const status: RaceStatus = telemetry?.status ?? "idle";
  const formLocked = status !== "idle";
  const startEnabled = status === "idle" && canStartRace(draft);

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
    loop.start();
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

  return (
    <div className="flex w-full flex-col gap-6">
      <form
        className="grid w-full gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart();
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Race distance
          <select
            value={distanceId}
            disabled={formLocked}
            onChange={(event) => setDistanceId(event.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {RACE_DISTANCES.map((distance) => (
              <option key={distance.id} value={distance.id}>
                {distance.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <AthleteFields
            athlete={athletes[0]}
            label="Athlete A"
            locked={formLocked}
            onChange={(patch) => updateAthlete(0, patch)}
          />
          <AthleteFields
            athlete={athletes[1]}
            label="Athlete B"
            locked={formLocked}
            onChange={(patch) => updateAthlete(1, patch)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {status === "idle" ? (
            <button
              type="submit"
              disabled={!startEnabled}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Start race
            </button>
          ) : null}
          {status === "running" ? (
            <button
              type="button"
              onClick={handlePause}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Pause
            </button>
          ) : null}
          {status === "paused" ? (
            <button
              type="button"
              onClick={handleResume}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Resume
            </button>
          ) : null}
          {status !== "idle" ? (
            <button
              type="button"
              onClick={handleReset}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
            >
              Reset
            </button>
          ) : null}
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <p
          className="text-center text-3xl tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50"
          data-testid="race-clock"
          aria-label="Race clock"
        >
          {formatRaceTime(telemetry?.raceTimeMs ?? 0)}
        </p>
        <p className="sr-only" data-testid="race-status">
          {status}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <AthleteReadout
            draft={athletes[0]}
            state={telemetry?.athletes[0] ?? null}
          />
          <AthleteReadout
            draft={athletes[1]}
            state={telemetry?.athletes[1] ?? null}
          />
        </div>
      </div>

      <TrackRenderer raceDistanceM={distanceM} athletes={trackAthletes} />
    </div>
  );
}

function AthleteFields({
  athlete,
  label,
  locked,
  onChange,
}: {
  athlete: AthleteDraft;
  label: string;
  locked: boolean;
  onChange: (patch: Partial<AthleteDraft>) => void;
}) {
  const nameError = nameFieldError(athlete.name);
  const timeError = timeFieldError(athlete.timeText);
  const nameId = `${athlete.id}-name`;
  const timeId = `${athlete.id}-time`;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</legend>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300" htmlFor={nameId}>
        {`${label} name`}
        <input
          id={nameId}
          value={athlete.name}
          disabled={locked}
          autoComplete="off"
          aria-invalid={nameError !== null}
          aria-describedby={nameError ? `${nameId}-error` : undefined}
          onChange={(event) => onChange({ name: event.target.value })}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      {nameError ? (
        <p id={`${nameId}-error`} role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          {nameError}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300" htmlFor={timeId}>
        {`${label} finishing time`}
        <input
          id={timeId}
          value={athlete.timeText}
          disabled={locked}
          autoComplete="off"
          spellCheck={false}
          placeholder="M:SS.ff"
          aria-invalid={timeError !== null}
          aria-describedby={timeError ? `${timeId}-error` : undefined}
          onChange={(event) => onChange({ timeText: event.target.value })}
          className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      {timeError ? (
        <p id={`${timeId}-error`} role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          {timeError}
        </p>
      ) : null}
    </fieldset>
  );
}

function AthleteReadout({
  draft,
  state,
}: {
  draft: AthleteDraft;
  state: AthleteRaceState | null;
}) {
  const name = state?.name ?? draft.name;
  const progress = state?.progress ?? 0;
  const completedLaps = state?.completedLaps ?? 0;

  return (
    <div
      className="rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
      data-testid={`athlete-readout-${draft.id}`}
    >
      <p className="font-medium text-zinc-950 dark:text-zinc-50">{name}</p>
      <p className="tabular-nums">
        Laps {completedLaps}
        <span className="mx-2">·</span>
        {Math.round(progress * 100)}%
      </p>
      {state?.finished ? (
        <p data-testid={`athlete-finished-time-${draft.id}`}>
          Finished {formatRaceTime(state.finishTimeMs)}
        </p>
      ) : null}
    </div>
  );
}
