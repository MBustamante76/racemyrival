import { PLAYBACK_RATES } from "@/domain/race";
import type { PlaybackRate } from "@/domain/race";

export function PlaybackSpeedControls({
  rate,
  onChange,
}: {
  rate: PlaybackRate;
  onChange: (rate: PlaybackRate) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Playback speed"
      data-testid="playback-speed"
      className="flex flex-wrap items-center gap-1"
    >
      {PLAYBACK_RATES.map((option) => {
        const selected = option === rate;
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
                ? "ui-transition min-h-11 rounded-[var(--rmr-radius-control)] bg-brand-navy px-3 py-2 text-sm font-semibold text-white"
                : "ui-transition min-h-11 rounded-[var(--rmr-radius-control)] border border-input-border px-3 py-2 text-sm font-semibold text-brand-navy"
            }
          >
            {`${option}x`}
          </button>
        );
      })}
    </div>
  );
}
