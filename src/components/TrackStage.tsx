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
      <div className="flex flex-col">
        <div className="order-1 px-3 pt-3 md:absolute md:inset-x-0 md:top-[42%] md:z-10 md:order-none md:px-0 md:pt-0">
          {clock}
        </div>
        <div className="order-2 w-full md:order-none">{track}</div>
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
    <div className="flex flex-col items-center gap-0.5 text-center md:pointer-events-none">
      <p
        className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-brand-navy sm:text-3xl"
        data-testid="race-clock"
        aria-label="Race clock"
        aria-live="polite"
        suppressHydrationWarning
      >
        {timeText}
      </p>
      <p className="font-display text-[11px] font-bold tracking-wide text-muted" data-testid="race-lap">
        {lapText}
      </p>
    </div>
  );
}
