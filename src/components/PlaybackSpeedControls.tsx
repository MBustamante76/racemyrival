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
                ? "min-h-10 rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "min-h-10 rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
            }
          >
            {`${option}x`}
          </button>
        );
      })}
    </div>
  );
}
