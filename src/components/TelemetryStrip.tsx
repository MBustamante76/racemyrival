import { formatRaceTime } from "@/domain/race";
import type { AthleteRaceState, RaceSnapshot } from "@/domain/race";
import type { AthleteDraft } from "./raceSession";
import {
  formatGapM,
  formatMetres,
  formatSpeedMps,
  telemetryStripView,
} from "./telemetryView";

export function TelemetryStrip({
  raceDistanceM,
  athletes,
  drafts,
  winnerSnapshot,
}: {
  raceDistanceM: number;
  athletes: readonly AthleteRaceState[] | undefined;
  drafts: readonly [AthleteDraft, AthleteDraft];
  winnerSnapshot: RaceSnapshot | null;
}) {
  const states = athletes ?? [];
  const view = telemetryStripView(
    raceDistanceM,
    states.length === 2
      ? states
      : drafts.map((draft) => ({
          id: draft.id,
          name: draft.name,
          finishTimeMs: 0,
          distanceCoveredM: 0,
          progress: 0,
          completedLaps: 0,
          currentLapProgress: 0,
          speedMps: 0,
          pacePer100mMs: 0,
          pacePer400mMs: 0,
          finished: false,
        })),
    winnerSnapshot,
  );

  return (
    <div
      data-testid="telemetry-strip"
      className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center"
    >
      <AthleteReadout
        athlete={view.athletes[0]}
        draftId={drafts[0].id}
        accent="athlete-a"
      />
      <div className="flex flex-col items-center px-3 text-center">
        <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.18em] text-near-black">
          Gap
        </p>
        <p
          className="font-sans text-2xl font-extrabold tabular-nums tracking-[-0.02em] text-near-black sm:text-3xl"
          data-testid="telemetry-gap"
        >
          {formatGapM(view.displayLeadM)}
        </p>
        <p
          className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-near-black"
          data-testid="telemetry-leader"
        >
          Behind
        </p>
      </div>
      <AthleteReadout
        athlete={view.athletes[1]}
        draftId={drafts[1].id}
        accent="athlete-b"
      />
    </div>
  );
}

function AthleteReadout({
  athlete,
  draftId,
  accent,
}: {
  athlete: { id: string; name: string; distanceM: number; speedMps: number; finished: boolean; finishTimeMs: number };
  draftId: string;
  accent: "athlete-a" | "athlete-b";
}) {
  const accentColor = accent === "athlete-a" ? "text-athlete-a" : "text-athlete-b";

  return (
    <div
      className="flex min-w-0 flex-col items-start gap-2 rounded-[var(--rmr-radius-card)] border border-border bg-card px-4 py-3 text-left shadow-card"
      data-testid={`athlete-readout-${draftId}`}
    >
      <div className="flex items-center gap-2">
        <RunningIcon className={`h-5 w-5 shrink-0 ${accentColor}`} />
        <p className={`truncate font-sans text-sm font-extrabold tracking-[-0.02em] ${accentColor}`}>
          {athlete.name}
        </p>
      </div>
      <div className="flex gap-8">
        <Stat
          value={formatMetres(athlete.distanceM)}
          label="Distance covered"
          testId={`athlete-distance-${draftId}`}
          valueClass={accentColor}
        />
        <Stat
          value={formatSpeedMps(athlete.speedMps)}
          label="Avg speed"
          testId={`athlete-speed-${draftId}`}
          valueClass={accentColor}
        />
      </div>
      {athlete.finished ? (
        <p data-testid={`athlete-finished-time-${draftId}`} className="text-[10px] font-bold uppercase tracking-[0.14em] text-near-black">
          Finished {formatRaceTime(athlete.finishTimeMs)}
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  value,
  label,
  testId,
  valueClass,
}: {
  value: string;
  label: string;
  testId: string;
  valueClass: string;
}) {
  return (
    <div className="min-w-0 text-left">
      <p
        className={`font-sans text-xl font-extrabold tabular-nums tracking-[-0.02em] sm:text-2xl ${valueClass}`}
        data-testid={testId}
      >
        {value}
      </p>
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-near-black">
        {label}
      </p>
    </div>
  );
}

function RunningIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="14.5" cy="4.2" r="1.7" fill="currentColor" />
      <path
        fill="currentColor"
        d="M9.2 8.1 12 9.4l1.4-1.6c.3-.4.8-.6 1.3-.6h2.1c.4 0 .7.3.7.7s-.3.7-.7.7h-1.8l-1.7 2 1.6 1.3c.3.3.5.7.5 1.1v2.1c0 .4-.3.7-.7.7s-.7-.3-.7-.7v-1.7l-1.8-1.5-1.2 4.3 2.6 1.6c.3.2.4.6.2 1s-.6.4-1 .2l-3.1-1.9c-.3-.2-.4-.5-.3-.8l1.4-5.1-1.8-.8-1.6 1.7c-.3.3-.7.3-1 .1s-.3-.7-.1-1l2.1-2.2c.2-.2.5-.3.8-.2Z"
      />
    </svg>
  );
}
