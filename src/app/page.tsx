import { RaceWorkspace } from "@/components/RaceWorkspace";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center overflow-x-hidden bg-zinc-50 px-4 py-6 font-sans sm:px-6 sm:py-10 dark:bg-black">
      <main className="flex w-full min-w-0 max-w-4xl flex-col items-center gap-4 sm:gap-6">
        <h1 className="text-center text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl dark:text-zinc-50">
          Race My Rival
        </h1>
        <p className="max-w-xl text-center text-sm text-balance text-zinc-600 dark:text-zinc-400">
          Enter two performances and start. Finishing times use minutes, seconds
          and hundredths. Live controls stay on one shared clock.
        </p>
        <RaceWorkspace />
      </main>
    </div>
  );
}
