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
      className="grid gap-2 rounded-[var(--rmr-radius-card)] border border-border bg-card p-3 shadow-card md:grid-cols-[1fr_auto_1fr] md:items-center"
    >
      <AthleteReadout
        athlete={view.athletes[0]}
        draftId={drafts[0].id}
        accent="athlete-a"
      />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Gap</p>
        <p className="font-display text-lg font-extrabold tabular-nums text-brand-navy" data-testid="telemetry-gap">
          {formatGapM(view.displayLeadM)}
        </p>
        <p className="text-xs text-muted" data-testid="telemetry-leader">
          {view.isTie ? "Level" : `${view.leaderName ?? "—"} leads`}
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
  const ring = accent === "athlete-a" ? "bg-athlete-a" : "bg-athlete-b";

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-[var(--rmr-radius-control)] bg-surface-alt px-3 py-2"
      data-testid={`athlete-readout-${draftId}`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ring} font-display text-[11px] font-bold text-white`}
      >
        {athleteInitials(athlete.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-brand-navy">{athlete.name}</p>
        <p className="tabular-nums text-xs text-muted">
          <span data-testid={`athlete-distance-${draftId}`}>{formatMetres(athlete.distanceM)}</span>
          <span className="mx-1.5">·</span>
          <span data-testid={`athlete-speed-${draftId}`}>{formatSpeedMps(athlete.speedMps)}</span>
        </p>
        {athlete.finished ? (
          <p data-testid={`athlete-finished-time-${draftId}`}>
            Finished {formatRaceTime(athlete.finishTimeMs)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
