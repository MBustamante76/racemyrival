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
  onReplay,
  onRaceAgain,
}: {
  result: RaceResult;
  athletes: readonly ResultAthleteView[];
  onReplay?: () => void;
  onRaceAgain?: () => void;
}) {
  const winner = athletes.find((athlete) => athlete.id === result.winnerId);
  const loser = athletes.find((athlete) => athlete.id !== result.winnerId);
  const distanceGapM = Math.round(result.snapshot.leadM);
  const winnerName = winner?.name ?? "Winner";

  return (
    <section
      aria-labelledby="race-complete-heading"
      className="result-reveal w-full min-w-0 max-w-full rounded-[var(--rmr-radius-card)] border border-border bg-card p-4 shadow-card"
      data-testid="result-panel"
      data-snapshot-race-time-ms={result.snapshot.raceTimeMs}
      data-snapshot-lead-m={result.snapshot.leadM}
    >
      <div className="flex items-start gap-3">
        <TrophyIcon />
        <div className="min-w-0 flex-1">
          <h2
            id="race-complete-heading"
            className="font-display text-lg font-extrabold tracking-wide text-brand-navy"
          >
            Race complete
          </h2>
          <p
            className="mt-1 font-display text-2xl font-extrabold uppercase tracking-wide text-brand-navy"
            data-testid="result-winner"
          >
            {result.isTie || !winner ? "Dead heat" : `${winner.name} wins`}
          </p>
          <p className="mt-2 font-display text-sm font-bold tabular-nums text-muted">
            {result.isTie ? (
              <span data-testid="result-winning-time">
                Winning time {formatRaceTime(result.winningTimeMs)}
              </span>
            ) : (
              <>
                <span data-testid="result-times-vs">
                  {formatRaceTime(result.winningTimeMs)} VS {loser ? formatRaceTime(loser.finishTimeMs) : "—"}
                </span>
                <span className="sr-only" data-testid="result-winning-time">
                  Winning time {formatRaceTime(result.winningTimeMs)}
                </span>
              </>
            )}
          </p>
          <ul className="sr-only">
            {athletes.map((athlete) => (
              <li key={athlete.id} className="tabular-nums" data-testid={`result-athlete-${athlete.id}`}>
                {athlete.name} {formatRaceTime(athlete.finishTimeMs)}
              </li>
            ))}
          </ul>
          {result.isTie ? null : (
            <>
              <p
                className="mt-3 font-display text-sm font-extrabold uppercase tracking-wide text-brand-red"
                data-testid="result-time-gap"
              >
                {formatRaceTime(result.timeGapMs)} seconds faster
              </p>
              <p className="mt-1 text-sm text-muted" data-testid="result-distance-gap">
                Approximately {distanceGapM} metres ahead when {winnerName} crossed the finish line
              </p>
            </>
          )}
        </div>
      </div>
      {onReplay || onRaceAgain ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onReplay ? (
            <button
              type="button"
              onClick={onReplay}
              className="min-h-11 rounded-[var(--rmr-radius-control)] bg-brand-red px-4 py-2 font-display text-sm font-extrabold tracking-wide text-white"
            >
              Replay
            </button>
          ) : null}
          {onRaceAgain ? (
            <button
              type="button"
              onClick={onRaceAgain}
              className="min-h-11 rounded-[var(--rmr-radius-control)] border border-input-border px-4 py-2 text-sm font-semibold text-brand-navy"
            >
              Race again
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TrophyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className="mt-1 h-8 w-8 shrink-0 text-gold"
      data-testid="result-trophy"
    >
      <path
        fill="currentColor"
        d="M8 4h16v2h3a3 3 0 0 1 3 3c0 5.2-3.6 8.4-8 9.2V21h3v3H7v-3h3v-2.8C5.6 17.4 2 14.2 2 9a3 3 0 0 1 3-3h3V4Zm2 2v2H5a1 1 0 0 0-1 1c0 3.7 2.4 6.1 6.2 6.8L11 16V8h2v8.9A12 12 0 0 0 16 25a12 12 0 0 0 3-8.1V8h2v8l.8-.2C25.6 15.1 28 12.7 28 9a1 1 0 0 0-1-1h-5V6H10Zm-1 21h14v3H9v-3Z"
      />
    </svg>
  );
}
