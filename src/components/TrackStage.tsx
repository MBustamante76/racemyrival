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
      className="relative flex w-full min-w-0 min-h-[min(52vh,26rem)] flex-col overflow-hidden rounded-[var(--rmr-radius-card)] border border-border bg-card shadow-card md:min-h-[min(58vh,32rem)]"
    >
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-3">
        {clock}
      </div>
      <div className="flex w-full flex-1 items-center px-0 py-2 md:py-3">
        {track}
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
    <div className="flex flex-col items-center gap-0.5 text-center sm:gap-1">
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
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px]" data-testid="race-lap">
        {lapText}
      </p>
    </div>
  );
}
