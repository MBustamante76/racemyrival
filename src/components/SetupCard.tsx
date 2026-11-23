import { RACE_DISTANCES } from "@/domain/race";
import { FinishingTimeFields } from "./FinishingTimeFields";
import { RACE_SETUP_FORM_ID } from "./RaceControls";
import { nameFieldError, timeFieldError } from "./raceSession";
import type { AthleteDraft } from "./raceSession";

const ATHLETE_COLUMN = {
  A: {
    visualLabel: "You",
    accessibleLabel: "Athlete A",
    namePlaceholder: "Your Name",
    nameAriaLabel: "Enter your name",
    /** Visible legend; aria field labels still use "Enter your time …". */
    timeLabel: "Time",
    timeAriaLabel: "Enter your time",
    labelClass: "text-athlete-a",
  },
  B: {
    visualLabel: "Rival",
    accessibleLabel: "Athlete B",
    namePlaceholder: "Rival's Name",
    nameAriaLabel: "Enter rival's name",
    timeLabel: "Time",
    timeAriaLabel: "Enter rival's time",
    labelClass: "text-athlete-b",
  },
} as const;

export function SetupCard({
  distanceId,
  athletes,
  formLocked,
  startEnabled = true,
  showStartButton = false,
  onDistanceChange,
  onAthleteChange,
  onStart,
}: {
  distanceId: string;
  athletes: [AthleteDraft, AthleteDraft];
  formLocked: boolean;
  startEnabled?: boolean;
  /** Full-width Start under the form (mobile / below lg). Desktop keeps Start under the track. */
  showStartButton?: boolean;
  onDistanceChange: (distanceId: string) => void;
  onAthleteChange: (index: 0 | 1, patch: Partial<AthleteDraft>) => void;
  onStart: () => void;
}) {
  return (
    <form
      id={RACE_SETUP_FORM_ID}
      data-testid="setup-card"
      className="flex w-full min-w-0 flex-col gap-3 rounded-[var(--rmr-radius-card)] border border-border bg-card p-3 shadow-card sm:gap-4 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-brand-navy sm:text-xl">
          Race setup
        </h2>
        <p className="text-xs text-muted" data-testid="share-name-privacy-note">
          Only enter names you are happy to share.
        </p>
      </div>

      <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-muted">
        Race distance
        <select
          value={distanceId}
          disabled={formLocked}
          aria-label="Select race distance"
          onChange={(event) => onDistanceChange(event.target.value)}
          className="min-h-11 w-full min-w-0 rounded-[var(--rmr-radius-control)] border border-input-border bg-surface-alt px-2 py-2 text-base font-semibold text-brand-navy"
        >
          {RACE_DISTANCES.map((distance) => (
            <option key={distance.id} value={distance.id}>
              {distance.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
        <AthleteColumn
          athlete={athletes[0]}
          locked={formLocked}
          onChange={(patch) => onAthleteChange(0, patch)}
        />
        <AthleteColumn
          athlete={athletes[1]}
          locked={formLocked}
          onChange={(patch) => onAthleteChange(1, patch)}
        />
      </div>

      {showStartButton ? (
        <button
          type="submit"
          disabled={!startEnabled || formLocked}
          aria-label="Start race"
          data-testid="setup-card-start"
          className="ui-transition inline-flex min-h-11 w-full items-center justify-center rounded-[var(--rmr-radius-control)] bg-brand-red px-5 py-2.5 font-display text-sm font-light uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Race
        </button>
      ) : null}
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
      <div className="flex min-w-0 flex-col gap-1">
        <span className={`font-display text-sm font-extrabold tracking-wide ${column.labelClass}`}>
          {column.visualLabel}
        </span>
        <label className="flex min-w-0 flex-col" htmlFor={nameId}>
          <span className="sr-only">{column.nameAriaLabel}</span>
          <input
            id={nameId}
            value={athlete.name}
            disabled={locked}
            autoComplete="off"
            placeholder={column.namePlaceholder}
            aria-label={column.nameAriaLabel}
            aria-invalid={nameError !== null}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            onChange={(event) => onChange({ name: event.target.value })}
            className="h-10 w-full min-w-0 rounded-[var(--rmr-radius-control)] border border-input-border bg-surface-alt px-2 text-base font-semibold text-brand-navy outline-none placeholder:font-medium placeholder:text-muted/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          />
        </label>
        {nameError ? (
          <p id={`${nameId}-error`} role="alert" className="text-sm text-brand-red">
            {nameError}
          </p>
        ) : null}
      </div>
      <FinishingTimeFields
        athleteId={athlete.id}
        label={column.timeLabel}
        ariaLabelPrefix={column.timeAriaLabel}
        time={athlete.time}
        locked={locked}
        error={timeError}
        onChange={(time) => onChange({ time })}
      />
    </fieldset>
  );
}
