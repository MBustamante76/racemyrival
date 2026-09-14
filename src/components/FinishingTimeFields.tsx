"use client";

import { useRef } from "react";
import type { KeyboardEvent, RefObject } from "react";
import {
  sanitizeHundredths,
  sanitizeMinutes,
  sanitizeSeconds,
} from "./raceSession";
import type { TimeParts } from "./raceSession";

type TimeField = keyof TimeParts;

export function FinishingTimeFields({
  athleteId,
  label,
  time,
  locked,
  error,
  onChange,
}: {
  athleteId: string;
  label: string;
  time: TimeParts;
  locked: boolean;
  error: string | null;
  onChange: (time: TimeParts) => void;
}) {
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);
  const hundredthsRef = useRef<HTMLInputElement>(null);
  const errorId = `${athleteId}-time-error`;

  function updateField(field: TimeField, raw: string): void {
    const sanitized =
      field === "minutes"
        ? sanitizeMinutes(raw)
        : field === "seconds"
          ? sanitizeSeconds(raw)
          : sanitizeHundredths(raw);
    onChange({ ...time, [field]: sanitized });

    if (field === "minutes" && sanitized.length === 2) {
      secondsRef.current?.focus();
    }
    if (field === "seconds" && sanitized.length === 2) {
      hundredthsRef.current?.focus();
    }
  }

  function handleKeyDown(field: TimeField, event: KeyboardEvent<HTMLInputElement>): void {
    if (field === "minutes" && (event.key === ":" || event.key === ".")) {
      event.preventDefault();
      secondsRef.current?.focus();
      return;
    }

    if (field === "seconds" && event.key === ".") {
      event.preventDefault();
      hundredthsRef.current?.focus();
      return;
    }

    if (event.key !== "Backspace" || time[field] !== "") {
      return;
    }

    event.preventDefault();
    if (field === "seconds") {
      minutesRef.current?.focus();
    }
    if (field === "hundredths") {
      secondsRef.current?.focus();
    }
  }

  return (
    <fieldset
      className="flex w-full min-w-0 flex-col gap-1"
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="sr-only">{label}</legend>
      <div className="flex w-full min-w-[10.5rem] max-w-[13rem] items-end gap-0.5 rounded-[var(--rmr-radius-control)] border border-input-border bg-card px-2 py-1">
        <TimePartInput
          id={`${athleteId}-minutes`}
          inputRef={minutesRef}
          fieldLabel={`${label.replace(/ finishing time$/, "")} minutes`}
          caption="M"
          value={time.minutes}
          locked={locked}
          invalid={error !== null}
          maxLength={2}
          onChange={(value) => updateField("minutes", value)}
          onKeyDown={(event) => handleKeyDown("minutes", event)}
        />
        <span aria-hidden="true" className="pb-5 text-sm font-semibold text-muted">
          :
        </span>
        <TimePartInput
          id={`${athleteId}-seconds`}
          inputRef={secondsRef}
          fieldLabel={`${label.replace(/ finishing time$/, "")} seconds`}
          caption="S"
          value={time.seconds}
          locked={locked}
          invalid={error !== null}
          maxLength={2}
          onChange={(value) => updateField("seconds", value)}
          onKeyDown={(event) => handleKeyDown("seconds", event)}
        />
        <span aria-hidden="true" className="pb-5 text-sm font-semibold text-muted">
          .
        </span>
        <TimePartInput
          id={`${athleteId}-hundredths`}
          inputRef={hundredthsRef}
          fieldLabel={`${label.replace(/ finishing time$/, "")} hundredths`}
          caption="10ths"
          value={time.hundredths}
          locked={locked}
          invalid={error !== null}
          maxLength={2}
          onChange={(value) => updateField("hundredths", value)}
          onKeyDown={(event) => handleKeyDown("hundredths", event)}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-brand-red">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function TimePartInput({
  id,
  inputRef,
  fieldLabel,
  caption,
  value,
  locked,
  invalid,
  maxLength,
  onChange,
  onKeyDown,
}: {
  id: string;
  inputRef: RefObject<HTMLInputElement | null>;
  fieldLabel: string;
  caption: string;
  value: string;
  locked: boolean;
  invalid: boolean;
  maxLength: number;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex min-w-[2rem] flex-1 flex-col items-center" htmlFor={id}>
      <span className="sr-only">{fieldLabel}</span>
      <input
        ref={inputRef}
        id={id}
        value={value}
        disabled={locked}
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={maxLength}
        aria-label={fieldLabel}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className="h-9 w-full min-w-0 border-0 bg-transparent px-0 text-center text-base font-semibold tabular-nums text-brand-navy outline-none"
      />
      <span aria-hidden="true" className="pb-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {caption}
      </span>
    </label>
  );
}
