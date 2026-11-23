import type { CSSProperties, ReactNode, Ref } from "react";
import type { LandscapeBand } from "./landscapeFit";
import { trackViewBox } from "./trackView";

function stageSizeClass(landscapeBand: LandscapeBand, raceHero: boolean): string {
  // Portrait / tall: existing caps.
  // Race-hero phone landscape: nearly full short-edge viewport for the oval.
  // Sheet landscape idle: title+strapline+controls (~9.5rem).
  // Inline landscape (701–900): leave room for the setup card (~20rem).
  // Band comes from screen short edge so the soft keyboard cannot resize the stage.
  if (raceHero) {
    return (
      "max-h-[calc(100svh-0.75rem)] " +
      "max-w-[min(100%,calc((100svh-0.75rem)*var(--track-aspect)))]"
    );
  }
  if (landscapeBand === "sheet") {
    return (
      "max-h-[calc(100svh-9.5rem)] " +
      "max-w-[min(100%,calc((100svh-9.5rem)*var(--track-aspect)))]"
    );
  }
  if (landscapeBand === "inline") {
    return (
      "max-h-[calc(100svh-20rem)] " +
      "max-w-[min(100%,calc((100svh-20rem)*var(--track-aspect)))]"
    );
  }
  return (
    "max-h-[calc(100svh-5.5rem)] " +
    "max-w-[min(100%,calc((100svh-5.5rem)*var(--track-aspect)))] " +
    "sm:max-w-[min(100%,calc(min(44svh,24rem)*var(--track-aspect)))] " +
    "md:max-w-[min(100%,calc(min(42svh,24rem)*var(--track-aspect)))] " +
    "lg:max-w-[min(100%,calc(min(46svh,26rem)*var(--track-aspect)))] " +
    "xl:max-w-[min(100%,calc(min(50svh,30rem)*var(--track-aspect)))]"
  );
}

export function TrackStage({
  clock,
  track,
  overlay,
  controls,
  stageRef,
  landscapeBand = "none",
  raceHero = false,
}: {
  clock: ReactNode;
  track: ReactNode;
  overlay?: ReactNode;
  /** Start / pause / speed — below the track by default; beside it in race-hero landscape. */
  controls?: ReactNode;
  stageRef?: Ref<HTMLElement>;
  /** Keyboard-stable landscape sizing band from useLandscapeBand(). */
  landscapeBand?: LandscapeBand;
  /** Phone landscape live race: grow the oval and dock controls to the side. */
  raceHero?: boolean;
}) {
  const viewBox = trackViewBox();
  const aspect = viewBox.width / viewBox.height;
  const stageStyle = {
    aspectRatio: `${viewBox.width} / ${viewBox.height}`,
    // Static Tailwind class names need a var — dynamic ${aspect} in class strings is not emitted.
    ["--track-aspect" as string]: String(aspect),
  } satisfies CSSProperties;
  const compactLandscape = landscapeBand !== "none";

  return (
    <div
      data-testid="track-stage-shell"
      data-race-hero={raceHero ? "true" : "false"}
      className={
        raceHero
          ? "flex w-full min-w-0 flex-row items-center gap-1.5 rounded-[var(--rmr-radius-card)] border border-border bg-card p-1 shadow-card sm:gap-2 sm:p-1.5"
          : "flex w-full min-w-0 flex-col rounded-[var(--rmr-radius-card)] border border-border bg-card shadow-card"
      }
    >
      <div className={"flex min-w-0 justify-center " + (raceHero ? "min-h-0 flex-1" : "w-full")}>
        <section
          ref={stageRef as Ref<HTMLDivElement>}
          data-testid="track-stage"
          data-landscape-band={landscapeBand}
          style={stageStyle}
          className={
            // max-w must use var(--track-aspect) so Tailwind emits the utility (see style above).
            "relative isolate min-h-0 w-full overflow-hidden " + stageSizeClass(landscapeBand, raceHero)
          }
        >
          {/* Inset so the oval never kisses overflow:hidden edges after height-budget scaling. */}
          <div
            className={
              "absolute overflow-hidden " +
              (raceHero ? "inset-1.5 sm:inset-2" : "inset-2 sm:inset-3")
            }
            data-testid="track-surface-frame"
          >
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
          data-controls-placement={raceHero ? "beside" : "below"}
          className={
            raceHero
              ? "relative z-20 flex w-[4.75rem] shrink-0 flex-col justify-center border-l border-border bg-card px-1 py-1 sm:w-[5.25rem] sm:px-1.5"
              : "relative z-20 shrink-0 border-t border-border bg-card px-2 py-1.5 sm:px-3 sm:py-2" +
                (compactLandscape ? " py-1" : "")
          }
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
  landscapeBand = "none",
}: {
  distanceLabel: string;
  timeText: string;
  lapText: string;
  landscapeBand?: LandscapeBand;
}) {
  const compact = landscapeBand !== "none";
  const tight = landscapeBand === "sheet";

  return (
    <div
      className={
        "flex flex-col items-center gap-0.5 text-center sm:gap-1" + (compact ? " gap-0" : "")
      }
    >
      <p
        className={
          "font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-near-black sm:text-xs md:text-sm" +
          (compact ? " text-[10px] sm:text-[10px] md:text-[10px]" : "")
        }
        data-testid="race-distance-readout"
      >
        {distanceLabel}
      </p>
      <p
        className={
          "font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px] md:text-xs" +
          (compact ? " text-[9px] sm:text-[9px] md:text-[9px]" : "")
        }
      >
        Race clock
      </p>
      <p
        className={
          "font-sans text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-4xl md:text-6xl lg:text-7xl" +
          (tight ? " !text-xl sm:!text-xl md:!text-xl lg:!text-xl" : "") +
          (compact && !tight ? " !text-2xl sm:!text-2xl md:!text-2xl lg:!text-2xl" : "")
        }
        data-testid="race-clock"
        aria-label="Race clock"
        aria-live="polite"
        suppressHydrationWarning
      >
        {timeText}
      </p>
      <p
        className={
          "font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-near-black sm:text-[11px] md:text-xs" +
          (compact ? " text-[9px] sm:text-[9px] md:text-[9px]" : "")
        }
        data-testid="race-lap"
      >
        {lapText}
      </p>
    </div>
  );
}
