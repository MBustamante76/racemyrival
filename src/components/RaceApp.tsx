"use client";

import { useSyncExternalStore } from "react";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { AppHeader } from "./AppHeader";
import { RaceWorkspace } from "./RaceWorkspace";
import { resolvePresentationMode } from "./presentation";
import type { PresentationMode } from "./presentation";

function subscribePresentation(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readClientPresentation(): PresentationMode {
  return resolvePresentationMode(window.location.search, window.localStorage);
}

function readServerPresentation(): PresentationMode {
  return "polished";
}

export function RaceApp({
  initialMode,
  loopDependencies,
}: {
  initialMode?: PresentationMode;
  loopDependencies?: RaceLoopDependencies;
} = {}) {
  const liveMode = useSyncExternalStore(
    subscribePresentation,
    readClientPresentation,
    readServerPresentation,
  );
  const mode = initialMode ?? liveMode;

  return (
    <div
      data-testid="presentation-root"
      data-presentation={mode}
      className={
        mode === "wireframe"
          ? "flex flex-1 flex-col overflow-x-hidden bg-zinc-50"
          : "flex flex-1 flex-col overflow-x-hidden bg-page"
      }
    >
      {mode === "polished" ? <AppHeader /> : null}
      <main
        className={
          mode === "wireframe"
            ? "mx-auto flex w-full min-w-0 max-w-4xl flex-col items-center gap-4 px-4 py-6"
            : "mx-auto flex w-full min-w-0 max-w-[1250px] flex-col gap-3 px-4 py-4 md:gap-4 md:px-6 md:py-5 lg:px-8"
        }
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <h1
            className={
              mode === "wireframe"
                ? "text-center text-xl font-semibold tracking-tight text-zinc-950"
                : "font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl"
            }
          >
            Race My Rival
          </h1>
          <p className={mode === "wireframe" ? "max-w-xl text-sm text-zinc-600" : "max-w-xl text-sm text-balance text-muted"}>
            {mode === "wireframe"
              ? "Enter two performances and start. Finishing times use minutes, seconds and hundredths. Live controls stay on one shared clock."
              : "See what the difference really looks like."}
          </p>
        </div>
        <RaceWorkspace loopDependencies={loopDependencies} />
      </main>
    </div>
  );
}
