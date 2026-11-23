import { PLAYBACK_RATES } from "@/domain/race";
import type { PlaybackRate } from "@/domain/race";

export function PlaybackSpeedControls({
  rate,
  onChange,
  layout = "row",
}: {
  rate: PlaybackRate;
  onChange: (rate: PlaybackRate) => void;
  /** Side-docked landscape race mode stacks speeds in a compact 2×2 grid. */
  layout?: "row" | "stack";
}) {
  const stack = layout === "stack";

  return (
    <div
      role="radiogroup"
      aria-label="Playback speed"
      data-testid="playback-speed"
      data-layout={layout}
      className={stack ? "grid grid-cols-2 gap-1" : "flex flex-nowrap items-center justify-center gap-1"}
    >
      {PLAYBACK_RATES.map((option) => {
        const selected = option === rate;
        const size = stack
          ? "inline-flex min-h-9 min-w-9 items-center justify-center rounded-[var(--rmr-radius-control)] px-1.5 text-xs font-semibold"
          : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--rmr-radius-control)] px-2 text-sm font-semibold";
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`playback-speed-${option}x`}
            onClick={() => onChange(option)}
            className={
              selected
                ? `ui-transition ${size} bg-brand-navy text-white`
                : `ui-transition ${size} border border-input-border text-brand-navy`
            }
          >
            {`${option}x`}
          </button>
        );
      })}
    </div>
  );
}
