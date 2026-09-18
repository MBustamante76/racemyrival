import type { PlaybackRate, RaceStatus } from "@/domain/race";
import { PlaybackSpeedControls } from "./PlaybackSpeedControls";

export const RACE_SETUP_FORM_ID = "race-setup";

export function RaceControls({
  status,
  startEnabled,
  playbackRate,
  onStart,
  onPause,
  onResume,
  onReset,
  onPlaybackRate,
}: {
  status: RaceStatus;
  startEnabled: boolean;
  playbackRate: PlaybackRate;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onPlaybackRate: (rate: PlaybackRate) => void;
}) {
  return (
    <div
      data-testid="race-controls"
      className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 sm:justify-between sm:gap-2"
    >
      <PlaybackSpeedControls rate={playbackRate} onChange={onPlaybackRate} />
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
        {status === "idle" ? (
          <button
            type="button"
            disabled={!startEnabled}
            aria-label="Start race"
            onClick={onStart}
            className="ui-transition inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[var(--rmr-radius-control)] bg-brand-red px-3 py-2 font-display text-xs font-light uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-5 sm:text-sm sm:tracking-[0.22em]"
          >
            Start race
            <span aria-hidden="true">▶</span>
          </button>
        ) : null}
        {status === "running" ? (
          <button
            type="button"
            onClick={onPause}
            className="min-h-11 shrink-0 rounded-[var(--rmr-radius-control)] bg-brand-navy px-3 py-2 font-display text-sm font-extrabold tracking-wide text-white sm:px-4"
          >
            Pause
          </button>
        ) : null}
        {status === "paused" ? (
          <button
            type="button"
            onClick={onResume}
            className="min-h-11 shrink-0 rounded-[var(--rmr-radius-control)] bg-brand-navy px-3 py-2 font-display text-sm font-extrabold tracking-wide text-white sm:px-4"
          >
            Resume
          </button>
        ) : null}
        {status !== "idle" ? (
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 shrink-0 rounded-[var(--rmr-radius-control)] border border-input-border px-3 py-2 text-sm font-semibold text-brand-navy sm:px-4"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
