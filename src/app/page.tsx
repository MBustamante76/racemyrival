import { TrackGeometryPreview } from "@/components/TrackGeometryPreview";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-10 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Race My Rival
        </h1>
        <p className="max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
          Phase C geometry preview. The 400m racing line is sampled from
          StadiumTrackGeometry, not from an SVG path length.
        </p>
        <TrackGeometryPreview />
      </main>
    </div>
  );
}
