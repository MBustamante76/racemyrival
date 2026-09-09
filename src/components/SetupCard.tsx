import { RACE_DISTANCES } from "@/domain/race";
import type { PlaybackRate, RaceStatus } from "@/domain/race";
import { athleteInitials } from "./athleteDisplay";
import { FinishingTimeFields } from "./FinishingTimeFields";
import { PlaybackSpeedControls } from "./PlaybackSpeedControls";
import { nameFieldError, timeFieldError } from "./raceSession";
import type { AthleteDraft } from "./raceSession";

const ATHLETE_COLUMN = {
  A: {
    visualLabel: "YOU",
    accessibleLabel: "Athlete A",
    ring: "bg-athlete-a",
    tint: "bg-athlete-a-tint",
  },
  B: {
    visualLabel: "RIVAL",
    accessibleLabel: "Athlete B",
    ring: "bg-athlete-b",
    tint: "bg-athlete-b-tint",
  },
} as const;

export function SetupCard({
  distanceId,
  athletes,
  status,
  formLocked,
  startEnabled,
  playbackRate,
  onDistanceChange,
  onAthleteChange,
  onStart,
  onPause,
  onResume,
  onReset,
  onPlaybackRate,
}: {
  distanceId: string;
  athletes: [AthleteDraft, AthleteDraft];
  status: RaceStatus;
  formLocked: boolean;
  startEnabled: boolean;
  playbackRate: PlaybackRate;
  onDistanceChange: (distanceId: string) => void;
  onAthleteChange: (index: 0 | 1, patch: Partial<AthleteDraft>) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onPlaybackRate: (rate: PlaybackRate) => void;
}) {
  return (
    <form
      data-testid="setup-card"
      className="grid w-full min-w-0 gap-3 rounded-[var(--rmr-radius-card)] border border-border bg-card p-3 shadow-card md:grid-cols-[minmax(7rem,9rem)_1fr_auto_1fr_minmax(11rem,14rem)] md:items-end md:gap-4 md:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Race distance
        <select
          value={distanceId}
          disabled={formLocked}
          onChange={(event) => onDistanceChange(event.target.value)}
          className="min-h-11 w-full min-w-0 rounded-[var(--rmr-radius-control)] border border-input-border bg-surface-alt px-2 py-2 text-sm font-semibold text-brand-navy"
        >
          {RACE_DISTANCES.map((distance) => (
            <option key={distance.id} value={distance.id}>
              {distance.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2 md:contents">
        <AthleteColumn
          athlete={athletes[0]}
          locked={formLocked}
          onChange={(patch) => onAthleteChange(0, patch)}
        />

        <p
          aria-hidden="true"
          className="hidden self-center font-display text-lg font-extrabold text-label md:block"
        >
          VS
        </p>

        <AthleteColumn
          athlete={athletes[1]}
          locked={formLocked}
          onChange={(patch) => onAthleteChange(1, patch)}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2 md:items-stretch">
        <div className="flex flex-wrap items-center gap-2">
          {status === "idle" ? (
            <button
              type="submit"
              disabled={!startEnabled}
              className="ui-transition min-h-11 flex-1 rounded-[var(--rmr-radius-control)] bg-brand-red px-4 py-2 font-display text-sm font-extrabold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
            >
              Start race
            </button>
          ) : null}
          {status === "running" ? (
            <button
              type="button"
              onClick={onPause}
              className="min-h-11 flex-1 rounded-[var(--rmr-radius-control)] bg-brand-navy px-4 py-2 font-display text-sm font-extrabold tracking-wide text-white md:flex-none"
            >
              Pause
            </button>
          ) : null}
          {status === "paused" ? (
            <button
              type="button"
              onClick={onResume}
              className="min-h-11 flex-1 rounded-[var(--rmr-radius-control)] bg-brand-navy px-4 py-2 font-display text-sm font-extrabold tracking-wide text-white md:flex-none"
            >
              Resume
            </button>
          ) : null}
          {status !== "idle" ? (
            <button
              type="button"
              onClick={onReset}
              className="min-h-11 rounded-[var(--rmr-radius-control)] border border-input-border px-4 py-2 text-sm font-semibold text-brand-navy"
            >
              Reset
            </button>
          ) : null}
        </div>
        <PlaybackSpeedControls rate={playbackRate} onChange={onPlaybackRate} />
      </div>
    </form>
  );
}

function AthleteColumn({
  athlete,
  locked,
  onChange,
}: {
  athlete: AthleteDraft;
  locked: boolean;
  onChange: (patch: Partial<AthleteDraft>) => void;
}) {
  const column = ATHLETE_COLUMN[athlete.id === "B" ? "B" : "A"];
  const nameError = nameFieldError(athlete.name);
  const timeError = timeFieldError(athlete.time);
  const nameId = `${athlete.id}-name`;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" data-testid={`setup-athlete-${athlete.id}`}>
      <legend className="sr-only">{column.accessibleLabel}</legend>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${column.ring} font-display text-[11px] font-bold text-white`}
        >
          {athleteInitials(athlete.name)}
        </span>
        <span className="font-display text-xs font-extrabold tracking-wide text-brand-navy">
          {column.visualLabel}
        </span>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted" htmlFor={nameId}>
        <span className="sr-only">{`${column.accessibleLabel} name`}</span>
        <input
          id={nameId}
          value={athlete.name}
          disabled={locked}
          autoComplete="off"
          aria-label={`${column.accessibleLabel} name`}
          aria-invalid={nameError !== null}
          aria-describedby={nameError ? `${nameId}-error` : undefined}
          onChange={(event) => onChange({ name: event.target.value })}
          className="min-h-11 w-full min-w-0 rounded-[var(--rmr-radius-control)] border border-input-border bg-surface-alt px-2 py-2 text-sm font-semibold text-brand-navy"
        />
      </label>
      {nameError ? (
        <p id={`${nameId}-error`} role="alert" className="text-sm text-brand-red">
          {nameError}
        </p>
      ) : null}
      <div className={`rounded-[var(--rmr-radius-control)] ${column.tint} px-2 py-2`}>
        <FinishingTimeFields
          athleteId={athlete.id}
          label={`${column.accessibleLabel} finishing time`}
          time={athlete.time}
          locked={locked}
          error={timeError}
          onChange={(time) => onChange({ time })}
        />
      </div>
    </fieldset>
  );
}
