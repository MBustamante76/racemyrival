import { formatRaceTime } from "@/domain/race";
import type { RaceResult } from "@/domain/race";

export interface ResultAthleteView {
  id: string;
  name: string;
  finishTimeMs: number;
}

export function ResultPanel({
  result,
  athletes,
}: {
  result: RaceResult;
  athletes: readonly ResultAthleteView[];
}) {
  const winner = athletes.find((athlete) => athlete.id === result.winnerId);
  const distanceGapM = Math.round(result.snapshot.leadM);

  return (
    <section
      aria-labelledby="race-complete-heading"
      className="w-full min-w-0 max-w-full rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-950"
      data-testid="result-panel"
      data-snapshot-race-time-ms={result.snapshot.raceTimeMs}
      data-snapshot-lead-m={result.snapshot.leadM}
    >
      <h2
        id="race-complete-heading"
        className="text-lg font-semibold tracking-wide text-zinc-950 dark:text-zinc-50"
      >
        Race complete
      </h2>
      <ul className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
        {athletes.map((athlete) => (
          <li key={athlete.id} className="tabular-nums" data-testid={`result-athlete-${athlete.id}`}>
            {athlete.name} {formatRaceTime(athlete.finishTimeMs)}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-medium text-zinc-950 dark:text-zinc-50" data-testid="result-winner">
        {result.isTie || !winner ? "Dead heat" : `${winner.name} wins`}
      </p>
      <p className="mt-1 tabular-nums text-sm text-zinc-700 dark:text-zinc-300" data-testid="result-winning-time">
        Winning time {formatRaceTime(result.winningTimeMs)}
      </p>
      {result.isTie ? null : (
        <>
          <p className="tabular-nums text-sm text-zinc-700 dark:text-zinc-300" data-testid="result-time-gap">
            {formatRaceTime(result.timeGapMs)} seconds faster
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300" data-testid="result-distance-gap">
            Approximately {distanceGapM} metres ahead when he crossed the finish line
          </p>
        </>
      )}
    </section>
  );
}
