import type { ReactNode, Ref } from "react";

export function TrackStage({
  clock,
  track,
  overlay,
  stageRef,
}: {
  clock: ReactNode;
  track: ReactNode;
  overlay?: ReactNode;
  stageRef?: Ref<HTMLElement>;
}) {
  return (
    <section
      ref={stageRef as Ref<HTMLDivElement>}
      data-testid="track-stage"
      className="relative flex w-full min-w-0 aspect-[198/134] min-h-0 flex-col overflow-hidden rounded-[var(--rmr-radius-card)] border border-border bg-card shadow-card sm:aspect-auto sm:min-h-[min(48vh,24rem)] md:min-h-[min(56vh,30rem)] lg:min-h-[min(58vh,34rem)]"
    >
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2 sm:px-3">
        {clock}
      </div>
      <div className="flex w-full flex-1 items-center px-0 py-0 sm:py-2 md:py-3">
        {track}
      </div>
      {overlay}
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
