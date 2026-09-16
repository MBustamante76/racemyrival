import type { PlaybackRate, RaceStatus } from "@/domain/race";
import { RACE_DISTANCES } from "@/domain/race";
import { athleteInitials } from "./athleteDisplay";
import { FinishingTimeFields } from "./FinishingTimeFields";
import { RaceControls } from "./RaceControls";
import { nameFieldError, timeFieldError } from "./raceSession";
import type { AthleteDraft } from "./raceSession";

const ATHLETE_COLUMN = {
  A: {
    visualLabel: "YOU",
    accessibleLabel: "Athlete A",
    labelClass: "text-athlete-a",
    avatarClass: "border-athlete-a bg-athlete-a-tint text-athlete-a",
  },
  B: {
    visualLabel: "RIVAL",
    accessibleLabel: "Athlete B",
    labelClass: "text-athlete-b",
    avatarClass: "border-athlete-b bg-athlete-b-tint text-athlete-b",
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
      className="grid w-full min-w-0 gap-3 rounded-[var(--rmr-radius-card)] border border-border bg-card p-3 shadow-card lg:grid-cols-[minmax(7rem,9rem)_1fr_auto_1fr_minmax(11rem,14rem)] lg:items-center lg:gap-4 lg:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <label className="flex min-w-0 flex-col justify-center gap-1 self-center text-xs font-semibold uppercase tracking-wide text-muted">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3 lg:contents">
        <AthleteColumn
          athlete={athletes[0]}
          locked={formLocked}
          onChange={(patch) => onAthleteChange(0, patch)}
        />

        <div
          aria-hidden="true"
          className="hidden flex-col items-center self-center lg:flex"
        >
          <span className="h-5 w-px bg-divider" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-divider bg-surface-alt text-xs font-semibold text-muted">
            vs
          </span>
          <span className="h-5 w-px bg-divider" />
        </div>

        <AthleteColumn
          athlete={athletes[1]}
          locked={formLocked}
          onChange={(patch) => onAthleteChange(1, patch)}
        />
      </div>

      <RaceControls
        status={status}
        startEnabled={startEnabled}
        playbackRate={playbackRate}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onReset={onReset}
        onPlaybackRate={onPlaybackRate}
        submitOnStart
      />
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
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${column.avatarClass} font-display text-sm font-bold`}
        >
          {athleteInitials(athlete.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`font-display text-xs font-extrabold tracking-wide ${column.labelClass}`}>
            {column.visualLabel}
          </span>
          <label className="flex min-w-0 flex-col" htmlFor={nameId}>
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
              className="h-9 w-full min-w-0 rounded-[var(--rmr-radius-control)] border border-input-border bg-surface-alt px-2 text-sm font-semibold text-brand-navy outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            />
          </label>
          {nameError ? (
            <p id={`${nameId}-error`} role="alert" className="text-sm text-brand-red">
              {nameError}
            </p>
          ) : null}
        </div>
      </div>
      <FinishingTimeFields
        athleteId={athlete.id}
        label={`${column.accessibleLabel} finishing time`}
        time={athlete.time}
        locked={locked}
        error={timeError}
        onChange={(time) => onChange({ time })}
      />
    </fieldset>
  );
}
