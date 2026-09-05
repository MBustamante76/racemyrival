import { TrackRenderer } from "@/components/TrackRenderer";
import { ConstantPaceModel, RaceEngine } from "@/domain/race";

const DISTANCE_M = 800;
const FINISH_A_MS = 124_000;
const FINISH_B_MS = 112_000;
const PREVIEW_ELAPSED_MS = FINISH_B_MS;

function previewAthletes() {
  const engine = new RaceEngine(
    {
      distanceM: DISTANCE_M,
      athletes: [
        { id: "A", name: "Marcelo", finishTimeMs: FINISH_A_MS },
        { id: "B", name: "Josh", finishTimeMs: FINISH_B_MS },
      ],
    },
    [
      new ConstantPaceModel(DISTANCE_M, FINISH_A_MS),
      new ConstantPaceModel(DISTANCE_M, FINISH_B_MS),
    ],
  );

  return engine.telemetryAt(PREVIEW_ELAPSED_MS).athletes.map((athlete) => ({
    id: athlete.id,
    name: athlete.name,
    distanceCoveredM: athlete.distanceCoveredM,
  }));
}

export default function Home() {
  const athletes = previewAthletes();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Race My Rival
        </h1>
        <p className="max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
          Phase G preview. Markers are placed from RaceEngine distances on the
          800m fixture at 1:52 — Josh at the finish, Marcelo still running. The
          SVG does not calculate the race. Live controls come next.
        </p>
        <TrackRenderer raceDistanceM={DISTANCE_M} athletes={athletes} />
      </main>
    </div>
  );
}
