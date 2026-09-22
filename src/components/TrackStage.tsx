import type { CSSProperties, ReactNode, Ref } from "react";
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
  const stageStyle = {
    aspectRatio: `${viewBox.width} / ${viewBox.height}`,
    // Static Tailwind class names need a var — dynamic ${aspect} in class strings is not emitted.
    ["--track-aspect" as string]: String(aspect),
  } satisfies CSSProperties;

  return (
    <div className="flex w-full min-w-0 flex-col rounded-[var(--rmr-radius-card)] border border-border bg-card shadow-card">
      <div className="flex w-full min-w-0 justify-center">
        <section
          ref={stageRef as Ref<HTMLDivElement>}
          data-testid="track-stage"
          style={stageStyle}
          className={
            // Portrait / tall: existing caps.
            // Short landscape (≤700, setup sheet): title+strapline+controls (~9.5rem).
            // Roomy landscape (701–900, inline setup): leave room for the setup card (~20rem).
            // max-w must use var(--track-aspect) so Tailwind emits the utility (see style above).
            "relative isolate min-h-0 w-full overflow-hidden " +
            "max-h-[calc(100svh-5.5rem)] " +
            "max-w-[min(100%,calc((100svh-5.5rem)*var(--track-aspect)))] " +
            "sm:max-w-[min(100%,calc(min(44svh,24rem)*var(--track-aspect)))] " +
            "md:max-w-[min(100%,calc(min(42svh,24rem)*var(--track-aspect)))] " +
            "lg:max-w-[min(100%,calc(min(46svh,26rem)*var(--track-aspect)))] " +
            "xl:max-w-[min(100%,calc(min(50svh,30rem)*var(--track-aspect)))] " +
            "[@media(orientation:landscape)_and_(max-height:700px)]:max-h-[calc(100svh-9.5rem)] " +
            "[@media(orientation:landscape)_and_(max-height:700px)]:max-w-[min(100%,calc((100svh-9.5rem)*var(--track-aspect)))] " +
            "[@media(orientation:landscape)_and_(min-height:701px)_and_(max-height:900px)]:max-h-[calc(100svh-20rem)] " +
            "[@media(orientation:landscape)_and_(min-height:701px)_and_(max-height:900px)]:max-w-[min(100%,calc((100svh-20rem)*var(--track-aspect)))]"
          }
        >
          {/* Inset so the oval never kisses overflow:hidden edges after height-budget scaling. */}
          <div className="absolute inset-2 overflow-hidden sm:inset-3" data-testid="track-surface-frame">
            {track}
          </div>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-2 sm:px-3">
            {clock}
          </div>
          {overlay}
        </section>
      </div>
      {controls ? (
        <div
          data-testid="track-controls"
          className="relative z-20 shrink-0 border-t border-border bg-card px-2 py-1.5 [@media(orientation:landscape)_and_(max-height:900px)]:py-1 sm:px-3 sm:py-2"
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
    <div className="flex flex-col items-center gap-0.5 text-center sm:gap-1 [@media(orientation:landscape)_and_(max-height:900px)]:gap-0">
      <p
        className="font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-near-black sm:text-xs md:text-sm [@media(orientation:landscape)_and_(max-height:900px)]:text-xs"
        data-testid="race-distance-readout"
      >
        {distanceLabel}
      </p>
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px] md:text-xs [@media(orientation:landscape)_and_(max-height:900px)]:text-[11px]">
        Race clock
      </p>
      <p
        className="font-sans text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-4xl md:text-6xl lg:text-7xl [@media(orientation:landscape)_and_(max-height:900px)]:!text-5xl"
        data-testid="race-clock"
        aria-label="Race clock"
        aria-live="polite"
        suppressHydrationWarning
      >
        {timeText}
      </p>
      <p
        className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px] md:text-xs [@media(orientation:landscape)_and_(max-height:900px)]:text-[11px]"
        data-testid="race-lap"
      >
        {lapText}
      </p>
    </div>
  );
}
