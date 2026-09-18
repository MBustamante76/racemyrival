import type { ReactNode, Ref } from "react";
import { trackViewBox } from "./trackView";

export function TrackStage({
  clock,
  track,
  overlay,
  controls,
  stageRef,
}: {
  clock: ReactNode;
  track: ReactNode;
  overlay?: ReactNode;
  /** Start / pause / speed — kept under the track so both stay in view on mobile. */
  controls?: ReactNode;
  stageRef?: Ref<HTMLElement>;
}) {
  const viewBox = trackViewBox();
  const aspect = viewBox.width / viewBox.height;

  return (
    <div className="flex w-full min-w-0 flex-col rounded-[var(--rmr-radius-card)] border border-border bg-card shadow-card">
      <section
        ref={stageRef as Ref<HTMLDivElement>}
        data-testid="track-stage"
        style={{ aspectRatio: `${viewBox.width} / ${viewBox.height}` }}
        className={
          "relative isolate mx-auto min-h-0 w-full overflow-hidden " +
          `sm:max-w-[min(100%,calc(min(44svh,24rem)*${aspect}))] ` +
          `md:max-w-[min(100%,calc(min(42svh,24rem)*${aspect}))] ` +
          `lg:max-w-[min(100%,calc(min(46svh,26rem)*${aspect}))] ` +
          `xl:max-w-[min(100%,calc(min(50svh,30rem)*${aspect}))]`
        }
      >
        {/* Absolutely contained so the SVG cannot paint over the controls row. */}
        <div className="absolute inset-0 overflow-hidden" data-testid="track-surface-frame">
          {track}
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2 sm:px-3">
          {clock}
        </div>
        {overlay}
      </section>
      {controls ? (
        <div
          data-testid="track-controls"
          className="relative z-20 shrink-0 border-t border-border bg-card px-2 py-1.5 sm:px-3 sm:py-2"
        >
          {controls}
        </div>
      ) : null}
    </div>
  );
}

export function RaceClockReadout({
  distanceLabel,
  timeText,
  lapText,
}: {
  distanceLabel: string;
  timeText: string;
  lapText: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center sm:gap-1">
      <p
        className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-near-black sm:text-xs md:text-sm"
        data-testid="race-distance-readout"
      >
        {distanceLabel}
      </p>
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px] md:text-xs">
        Race clock
      </p>
      <p
        className="font-sans text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-4xl md:text-6xl lg:text-7xl"
        data-testid="race-clock"
        aria-label="Race clock"
        aria-live="polite"
        suppressHydrationWarning
      >
        {timeText}
      </p>
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px] md:text-xs" data-testid="race-lap">
        {lapText}
      </p>
    </div>
  );
}
