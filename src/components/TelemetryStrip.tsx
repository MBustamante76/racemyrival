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
        align="start"
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
        align="end"
      />
    </div>
  );
}

function AthleteReadout({
  athlete,
  draftId,
  accent,
  align,
}: {
  athlete: { id: string; name: string; distanceM: number; speedMps: number; finished: boolean; finishTimeMs: number };
  draftId: string;
  accent: "athlete-a" | "athlete-b";
  align: "start" | "end";
}) {
  const accentColor = accent === "athlete-a" ? "text-athlete-a" : "text-athlete-b";
  const dividerColor = accent === "athlete-a" ? "via-athlete-a/40" : "via-athlete-b/40";

  return (
    <div
      className={`flex w-[88%] min-w-0 flex-col items-start gap-2 rounded-[var(--rmr-radius-card)] border border-border bg-card px-4 py-3 text-left shadow-card ${align === "end" ? "justify-self-end" : "justify-self-start"}`}
      data-testid={`athlete-readout-${draftId}`}
    >
      <p className="truncate font-sans text-sm font-extrabold tracking-[-0.02em] text-near-black">
        {athlete.name}
      </p>
      <div className="relative grid w-full grid-cols-2">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0.5 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent ${dividerColor} to-transparent`}
        />
        <Stat
          value={formatMetres(athlete.distanceM)}
          label="Distance covered"
          testId={`athlete-distance-${draftId}`}
          valueClass={accentColor}
          className="pr-3"
        />
        <Stat
          value={formatSpeedMps(athlete.speedMps)}
          label="Avg speed"
          testId={`athlete-speed-${draftId}`}
          valueClass={accentColor}
          className="pl-3"
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
  className = "",
}: {
  value: string;
  label: string;
  testId: string;
  valueClass: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 w-full text-left ${className}`}>
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
