import { formatRaceTime } from "@/domain/race";
import type { AthleteRaceState, RaceSnapshot } from "@/domain/race";
import { athleteInitials } from "./athleteDisplay";
import type { AthleteDraft } from "./raceSession";
import {
  formatGapM,
  formatMetres,
  formatSpeedMps,
  telemetryStripView,
} from "./telemetryView";
import type { TelemetryAthleteView } from "./telemetryView";

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
    <div data-testid="telemetry-strip" className="w-full min-w-0">
      <div className="rounded-[var(--rmr-radius-card)] border border-border bg-card px-3 py-2 shadow-card md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <AthleteReadout
          athlete={view.athletes[0]}
          draftId={drafts[0].id}
          accent="athlete-a"
          align="start"
          leadM={view.displayLeadM}
          isLeader={view.leaderId === view.athletes[0]?.id}
          isTie={view.isTie}
        />
        <div className="hidden flex-col items-center px-3 text-center md:flex">
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
          leadM={view.displayLeadM}
          isLeader={view.leaderId === view.athletes[1]?.id}
          isTie={view.isTie}
        />
      </div>
    </div>
  );
}

function AthleteReadout({
  athlete,
  draftId,
  accent,
  align,
  leadM,
  isLeader,
  isTie,
}: {
  athlete: TelemetryAthleteView;
  draftId: string;
  accent: "athlete-a" | "athlete-b";
  align: "start" | "end";
  leadM: number;
  isLeader: boolean;
  isTie: boolean;
}) {
  const accentColor = accent === "athlete-a" ? "text-athlete-a" : "text-athlete-b";
  const accentDot = accent === "athlete-a" ? "bg-athlete-a" : "bg-athlete-b";
  const avatarClass =
    accent === "athlete-a"
      ? "border-athlete-a bg-athlete-a-tint text-athlete-a"
      : "border-athlete-b bg-athlete-b-tint text-athlete-b";
  const dividerColor = accent === "athlete-a" ? "via-athlete-a/40" : "via-athlete-b/40";
  const statusLabel = isTie ? "Level" : isLeader ? "Ahead" : "Behind";
  const statusClass = isTie
    ? "text-near-black"
    : isLeader
      ? accentColor
      : "text-near-black";

  return (
    <div
      className={`min-w-0 border-b border-border py-2.5 last:border-b-0 md:flex md:w-[88%] md:flex-col md:items-start md:gap-2 md:rounded-[var(--rmr-radius-card)] md:border md:border-border md:bg-card md:px-4 md:py-3 md:text-left md:shadow-card ${align === "end" ? "md:justify-self-end" : "md:justify-self-start"}`}
      data-testid={`athlete-readout-${draftId}`}
    >
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${accentDot}`} />
        <span
          aria-hidden="true"
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${avatarClass} font-display text-[10px] font-bold`}
        >
          {athleteInitials(athlete.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold tracking-[-0.02em] text-near-black">
            {athlete.name}
          </p>
          {athlete.finished ? (
            <p
              data-testid={`athlete-finished-time-${draftId}`}
              className="text-[9px] font-bold uppercase tracking-[0.12em] text-near-black"
            >
              Finished {formatRaceTime(athlete.finishTimeMs)}
            </p>
          ) : null}
        </div>
        <p
          className={`shrink-0 font-sans text-lg font-extrabold tabular-nums tracking-[-0.02em] ${accentColor}`}
          data-testid={`athlete-distance-${draftId}`}
        >
          {formatMetres(athlete.distanceM)}
        </p>
        <p
          className={`w-[4.75rem] shrink-0 text-right font-sans text-sm font-extrabold tabular-nums tracking-[-0.02em] ${accentColor}`}
          data-testid={`athlete-speed-${draftId}`}
        >
          {formatSpeedMps(athlete.speedMps)}
        </p>
        <div className="w-12 shrink-0 text-right">
          <p className={`font-sans text-[9px] font-extrabold uppercase tracking-[0.12em] ${statusClass}`}>
            {statusLabel}
          </p>
          <p className="font-sans text-sm font-extrabold tabular-nums tracking-[-0.02em] text-near-black">
            {formatGapM(leadM)}
          </p>
        </div>
      </div>

      <p className="hidden truncate font-sans text-sm font-extrabold tracking-[-0.02em] text-near-black md:block">
        {athlete.name}
      </p>
      <div className="relative hidden w-full grid-cols-2 md:grid">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0.5 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent ${dividerColor} to-transparent`}
        />
        <Stat
          value={formatMetres(athlete.distanceM)}
          label="Distance covered"
          valueClass={accentColor}
          className="pr-3"
        />
        <Stat
          value={formatSpeedMps(athlete.speedMps)}
          label="Avg speed"
          valueClass={accentColor}
          className="pl-3"
        />
      </div>
      {athlete.finished ? (
        <p className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-near-black md:block">
          Finished {formatRaceTime(athlete.finishTimeMs)}
        </p>
      ) : null}
    </div>
  );
}

function Stat({
  value,
  label,
  valueClass,
  className = "",
}: {
  value: string;
  label: string;
  valueClass: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 w-full text-left ${className}`}>
      <p className={`font-sans text-xl font-extrabold tabular-nums tracking-[-0.02em] sm:text-2xl ${valueClass}`}>
        {value}
      </p>
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-near-black">
        {label}
      </p>
    </div>
  );
}
