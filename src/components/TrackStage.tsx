import type { ReactNode } from "react";

export function TrackStage({
  clock,
  track,
}: {
  clock: ReactNode;
  track: ReactNode;
}) {
  return (
    <section
      data-testid="track-stage"
      className="relative w-full min-w-0 overflow-hidden rounded-[var(--rmr-radius-card)] border border-border bg-card shadow-card"
    >
      <div className="absolute inset-x-0 top-[18%] z-10 px-3 md:top-[calc(42%-30px)] md:px-0">
        {clock}
      </div>
      <div className="w-full overflow-hidden px-1 py-2 md:overflow-visible md:px-0 md:py-0">
        <div className="relative left-1/2 w-[148%] max-w-none -translate-x-1/2 md:left-0 md:w-full md:translate-x-0">
          {track}
        </div>
      </div>
    </section>
  );
}

export function RaceClockReadout({
  timeText,
  lapText,
}: {
  timeText: string;
  lapText: string;
}) {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-0.5 pt-3 text-center sm:gap-1 sm:pt-1 md:pt-0">
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px]">
        Race clock
      </p>
      <p
        className="font-sans text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-4xl md:text-5xl"
        data-testid="race-clock"
        aria-label="Race clock"
        aria-live="polite"
        suppressHydrationWarning
      >
        {timeText}
      </p>
      <p className="-mt-0.5 font-sans text-[9px] font-bold tracking-[0.18em] text-near-black sm:text-[11px]">
        seconds
      </p>
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px]" data-testid="race-lap">
        {lapText}
      </p>
    </div>
  );
}
