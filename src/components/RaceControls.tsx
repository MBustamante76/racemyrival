import type { PlaybackRate, RaceStatus } from "@/domain/race";
import { PlaybackSpeedControls } from "./PlaybackSpeedControls";

export function RaceControls({
  status,
  startEnabled,
  playbackRate,
  onStart,
  onPause,
  onResume,
  onReset,
  onPlaybackRate,
  submitOnStart = false,
}: {
  status: RaceStatus;
  startEnabled: boolean;
  playbackRate: PlaybackRate;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onPlaybackRate: (rate: PlaybackRate) => void;
  /** When true, Start is type=submit for embedding inside SetupCard form. */
  submitOnStart?: boolean;
}) {
  return (
    <div
      data-testid="race-controls"
      className="flex min-w-0 flex-col items-center justify-center gap-2 self-center"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {status === "idle" ? (
          <button
            type={submitOnStart ? "submit" : "button"}
            disabled={!startEnabled}
            aria-label="Start race"
            onClick={submitOnStart ? undefined : onStart}
            className="ui-transition inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--rmr-radius-control)] bg-brand-red px-5 py-2 font-display text-sm font-light uppercase tracking-[0.22em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start race
            <span aria-hidden="true">▶</span>
          </button>
        ) : null}
        {status === "running" ? (
          <button
            type="button"
            onClick={onPause}
            className="min-h-11 flex-1 rounded-[var(--rmr-radius-control)] bg-brand-navy px-4 py-2 font-display text-sm font-extrabold tracking-wide text-white sm:flex-none"
          >
            Pause
          </button>
        ) : null}
        {status === "paused" ? (
          <button
            type="button"
            onClick={onResume}
            className="min-h-11 flex-1 rounded-[var(--rmr-radius-control)] bg-brand-navy px-4 py-2 font-display text-sm font-extrabold tracking-wide text-white sm:flex-none"
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
  );
}
