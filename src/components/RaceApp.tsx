"use client";

import { useSyncExternalStore } from "react";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { AppHeader } from "./AppHeader";
import { BrandHeader, PartnerShell } from "./PartnerShell";
import { RaceWorkspace } from "./RaceWorkspace";
import { resolvePresentationMode } from "./presentation";
import type { PresentationMode } from "./presentation";
import { SHOW_APP_HEADER } from "./uiFlags";

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

function readChallengeName(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value = new URLSearchParams(window.location.search).get("challenge");
  return value?.trim() || undefined;
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
  const challengePrefillName = useSyncExternalStore(
    subscribePresentation,
    readChallengeName,
    () => undefined,
  );

  if (mode === "wireframe") {
    return (
      <div
        data-testid="presentation-root"
        data-presentation={mode}
        className="flex flex-1 flex-col overflow-x-hidden bg-zinc-50"
      >
        <main className="mx-auto flex w-full min-w-0 max-w-4xl flex-col items-center gap-4 px-4 py-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="sr-only">Race My Rival</h1>
            {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG from public/brand */}
            <img
              src="/brand/race-my-rival-with-tagline-colour.svg"
              alt="Race My Rival — Turn times into races."
              className="h-auto w-full max-w-[16rem]"
              data-testid="brand-logo-wireframe"
            />
          </div>
          <RaceWorkspace
            loopDependencies={loopDependencies}
            challengePrefillName={challengePrefillName}
          />
        </main>
      </div>
    );
  }

  return (
    <div
      data-testid="presentation-root"
      data-presentation={mode}
      className="flex flex-1 flex-col overflow-x-hidden bg-page"
    >
      {SHOW_APP_HEADER ? <AppHeader /> : null}
      <main className="flex w-full min-w-0 flex-1 flex-col">
        <PartnerShell header={<BrandHeader />}>
          <RaceWorkspace
            loopDependencies={loopDependencies}
            challengePrefillName={challengePrefillName}
          />
        </PartnerShell>
      </main>
    </div>
  );
}
