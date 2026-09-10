import { formatRaceTime } from "@/domain/race";
import type { RaceResult } from "@/domain/race";

export interface ResultAthleteView {
  id: string;
  name: string;
  finishTimeMs: number;
}

const ACTION_BUTTON =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-input-border bg-card px-4 py-2 font-sans text-sm font-extrabold tracking-[-0.02em] text-near-black";

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
  const winnerAccent =
    winner?.id === "B" ? "text-athlete-b" : winner?.id === "A" ? "text-athlete-a" : "text-near-black";
  const showActions = Boolean(onReplay || onRaceAgain);

  return (
    <section
      aria-labelledby="race-complete-heading"
      className="result-reveal w-full min-w-0 max-w-full rounded-[var(--rmr-radius-card)] border border-border bg-card px-4 py-5 shadow-card md:px-6"
      data-testid="result-panel"
      data-snapshot-race-time-ms={result.snapshot.raceTimeMs}
      data-snapshot-lead-m={result.snapshot.leadM}
    >
      <h2 id="race-complete-heading" className="sr-only">
        Race complete
      </h2>
      <div className="grid items-center gap-5 text-center md:grid-cols-3 md:text-left">
        <div className="flex flex-col items-center gap-5 md:col-span-2 md:flex-row md:items-center">
          <TrophyIcon />
          <div className="min-w-0">
            <p
              className={`font-sans text-2xl font-extrabold uppercase tracking-[-0.02em] sm:text-3xl ${winnerAccent}`}
              data-testid="result-winner"
            >
              {result.isTie || !winner ? "Dead heat" : `${winner.name} wins`}
            </p>
            <p className="mt-2 font-sans text-lg font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-xl">
              {result.isTie ? (
                <span data-testid="result-winning-time">
                  Winning time {formatRaceTime(result.winningTimeMs)}
                </span>
              ) : (
                <>
                  <span data-testid="result-times-vs">
                    <span className={winnerAccent}>{formatRaceTime(result.winningTimeMs)}</span>
                    {" "}
                    <span className="text-xs font-bold lowercase tracking-[0.12em] text-near-black">VS</span>
                    {" "}
                    <span>{loser ? formatRaceTime(loser.finishTimeMs) : "—"}</span>
                  </span>
                  <span className="sr-only" data-testid="result-winning-time">
                    Winning time {formatRaceTime(result.winningTimeMs)}
                  </span>
                </>
              )}
            </p>
            {result.isTie ? null : (
              <p
                className="mt-2 font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-near-black"
                data-testid="result-time-gap"
              >
                {formatRaceTime(result.timeGapMs)} seconds faster
              </p>
            )}
          </div>
        </div>
        {result.isTie ? (
          <div className="hidden md:block" />
        ) : (
          <p
            className="min-w-0 text-center font-sans text-sm font-medium leading-snug text-near-black"
            data-testid="result-distance-gap"
          >
            <span className={`block font-sans text-2xl font-extrabold uppercase tracking-[-0.02em] sm:text-3xl ${winnerAccent}`}>
              {winnerName}
            </span>
            Approximately{" "}
            <span className={`block font-sans text-xl font-extrabold uppercase tracking-[-0.02em] sm:text-2xl ${winnerAccent}`}>
              {distanceGapM} metres ahead
            </span>{" "}
            when {winnerName} crossed the finish line
          </p>
        )}
      </div>
      <ul className="sr-only">
        {athletes.map((athlete) => (
          <li key={athlete.id} className="tabular-nums" data-testid={`result-athlete-${athlete.id}`}>
            {athlete.name} {formatRaceTime(athlete.finishTimeMs)}
          </li>
        ))}
      </ul>
      {showActions ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-3 sm:items-center">
          {onReplay ? (
            <button type="button" onClick={onReplay} className={ACTION_BUTTON}>
              <ReplayIcon />
              Replay
            </button>
          ) : null}
          {onRaceAgain ? (
            <button type="button" onClick={onRaceAgain} className={ACTION_BUTTON}>
              <RaceAgainIcon />
              Race again
            </button>
          ) : null}
          <button type="button" aria-disabled="true" className={`${ACTION_BUTTON} cursor-not-allowed opacity-70`}>
            <ShareIcon />
            Share result
          </button>
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
      className="mx-auto hidden h-12 w-12 shrink-0 text-gold md:mx-0 md:block"
      data-testid="result-trophy"
    >
      <path
        fill="currentColor"
        d="M8 4h16v2h3a3 3 0 0 1 3 3c0 5.2-3.6 8.4-8 9.2V21h3v3H7v-3h3v-2.8C5.6 17.4 2 14.2 2 9a3 3 0 0 1 3-3h3V4Zm2 2v2H5a1 1 0 0 0-1 1c0 3.7 2.4 6.1 6.2 6.8L11 16V8h2v8.9A12 12 0 0 0 16 25a12 12 0 0 0 3-8.1V8h2v8l.8-.2C25.6 15.1 28 12.7 28 9a1 1 0 0 0-1-1h-5V6H10Zm-1 21h14v3H9v-3Z"
      />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4.2 10a5.8 5.8 0 1 1 1.7 4.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M3.2 6.2v4.2h4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RaceAgainIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M4 10a6 6 0 1 0 1.8-4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M3.2 3.6v3.8h3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <circle cx="14.5" cy="4.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5.5" cy="10" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14.5" cy="15.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9.2 13 5.4M7 10.8 13 14.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
