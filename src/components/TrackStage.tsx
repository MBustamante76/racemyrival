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
        <div className="order-1 px-3 pt-3 md:absolute md:inset-x-0 md:top-[calc(42%-30px)] md:z-10 md:order-none md:px-0 md:pt-0">
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
    <div className="flex flex-col items-center gap-1 text-center md:pointer-events-none">
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-near-black">
        Race clock
      </p>
      <p
        className="font-sans text-4xl font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-5xl"
        data-testid="race-clock"
        aria-label="Race clock"
        aria-live="polite"
        suppressHydrationWarning
      >
        {timeText}
      </p>
      <p className="-mt-0.5 font-sans text-[11px] font-bold tracking-[0.18em] text-near-black">
        seconds
      </p>
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-near-black" data-testid="race-lap">
        {lapText}
      </p>
    </div>
  );
}
