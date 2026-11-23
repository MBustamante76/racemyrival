import type { PlaybackRate, RaceStatus } from "@/domain/race";
import { PlaybackSpeedControls } from "./PlaybackSpeedControls";

export const RACE_SETUP_FORM_ID = "race-setup";

export function RaceControls({
  status,
  startEnabled,
  playbackRate,
  showStart = true,
  showSpeed = true,
  layout = "row",
  onStart,
  onPause,
  onResume,
  onReset,
  onPlaybackRate,
}: {
  status: RaceStatus;
  startEnabled: boolean;
  playbackRate: PlaybackRate;
  /** When false, idle Start lives in SetupCard / sheet footer instead. */
  showStart?: boolean;
  /** Speed is only useful once the race is live. */
  showSpeed?: boolean;
  /** Side-docked phone landscape race mode. */
  layout?: "row" | "stack";
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onPlaybackRate: (rate: PlaybackRate) => void;
}) {
  const showIdleStart = status === "idle" && showStart;
  const showPause = status === "running";
  const showResume = status === "paused";
  const showReset = status !== "idle";
  const hasActions = showIdleStart || showPause || showResume || showReset;
  const stack = layout === "stack";

  if (!showSpeed && !hasActions) {
    return null;
  }

  const actionClass = stack
    ? "min-h-9 w-full shrink-0 rounded-[var(--rmr-radius-control)] px-1.5 py-1.5 font-display text-[11px] font-extrabold tracking-wide"
    : "min-h-11 shrink-0 rounded-[var(--rmr-radius-control)] px-3 py-2 font-display text-sm font-extrabold tracking-wide sm:px-4";

  return (
    <div
      data-testid="race-controls"
      data-layout={layout}
      className={
        stack
          ? "flex w-full min-w-0 flex-col items-stretch gap-1"
          : "flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2"
      }
    >
      {showSpeed ? (
        <PlaybackSpeedControls rate={playbackRate} layout={layout} onChange={onPlaybackRate} />
      ) : null}
      {hasActions ? (
        <div
          className={
            stack
              ? "flex w-full flex-col items-stretch gap-1"
              : "flex min-w-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2"
          }
        >
          {showIdleStart ? (
            <button
              type="button"
              disabled={!startEnabled}
              aria-label="Start race"
              onClick={onStart}
              className={
                stack
                  ? "ui-transition inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-[var(--rmr-radius-control)] bg-brand-red px-1.5 py-1.5 font-display text-[11px] font-light uppercase tracking-[0.08em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                  : "ui-transition inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[var(--rmr-radius-control)] bg-brand-red px-3 py-2 font-display text-xs font-light uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-5 sm:text-sm sm:tracking-[0.22em]"
              }
            >
              Start race
              <span aria-hidden="true">▶</span>
            </button>
          ) : null}
          {showPause ? (
            <button type="button" onClick={onPause} className={`${actionClass} bg-brand-navy text-white`}>
              Pause
            </button>
          ) : null}
          {showResume ? (
            <button type="button" onClick={onResume} className={`${actionClass} bg-brand-navy text-white`}>
              Resume
            </button>
          ) : null}
          {showReset ? (
            <button
              type="button"
              onClick={onReset}
              className={
                stack
                  ? "min-h-9 w-full shrink-0 rounded-[var(--rmr-radius-control)] border border-input-border px-1.5 py-1.5 text-[11px] font-semibold text-brand-navy"
                  : "min-h-11 shrink-0 rounded-[var(--rmr-radius-control)] border border-input-border px-3 py-2 text-sm font-semibold text-brand-navy sm:px-4"
              }
            >
              Reset
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
