"use client";

import { useState } from "react";
import {
  trackLinkCopied,
  trackShareCompleted,
  trackShareInitiated,
  trackShareOpened,
} from "./analytics";

const ACTION_BUTTON =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-input-border bg-card px-4 py-2 font-sans text-sm font-extrabold tracking-[-0.02em] text-near-black";

const PRIMARY_BUTTON =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-red px-4 py-2 font-sans text-sm font-extrabold tracking-[-0.02em] text-white hover:bg-brand-red-hover";

export type ShareRacePayload = {
  distanceId: string;
  distanceM: number;
  distanceLabel: string;
  nameA: string;
  nameB: string;
  finishTimeMsA: number;
  finishTimeMsB: number;
  sourceRaceId?: string;
};

async function createSharedRaceUrl(payload: ShareRacePayload): Promise<{ id: string; url: string }> {
  const response = await fetch("/api/races", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      distanceId: payload.distanceId,
      distanceM: payload.distanceM,
      competitorA: {
        displayName: payload.nameA,
        finishTimeMs: payload.finishTimeMsA,
      },
      competitorB: {
        displayName: payload.nameB,
        finishTimeMs: payload.finishTimeMsB,
      },
    }),
  });
  if (!response.ok) {
    throw new Error("Share failed");
  }
  return (await response.json()) as { id: string; url: string };
}

export function ShareRaceControls({
  payload,
  className,
}: {
  payload: ShareRacePayload;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [raceId, setRaceId] = useState<string | null>(null);

  const analyticsBase = {
    distanceId: payload.distanceId,
    distanceM: payload.distanceM,
  };

  async function ensureUrl(): Promise<{ id: string; url: string }> {
    if (sharedUrl && raceId) {
      return { id: raceId, url: sharedUrl };
    }
    const created = await createSharedRaceUrl(payload);
    setSharedUrl(created.url);
    setRaceId(created.id);
    return created;
  }

  async function handleShare(): Promise<void> {
    setError(null);
    setBusy(true);
    trackShareOpened({ ...analyticsBase, shareSurface: "result_panel" });
    try {
      const created = await ensureUrl();
      const shareText = `${payload.nameA} has challenged ${payload.nameB} over ${payload.distanceLabel}. Who won?`;
      const canNativeShare =
        typeof navigator !== "undefined" && typeof navigator.share === "function";

      if (canNativeShare) {
        trackShareInitiated({
          ...analyticsBase,
          raceId: created.id,
          shareSurface: "native",
        });
        try {
          await navigator.share({
            title: `${payload.nameA} vs ${payload.nameB}`,
            text: shareText,
            url: created.url,
          });
          trackShareCompleted({
            ...analyticsBase,
            raceId: created.id,
            shareSurface: "native",
          });
        } catch (shareError) {
          // User cancelled — do not record share_completed.
          if (shareError instanceof DOMException && shareError.name === "AbortError") {
            return;
          }
          // Fall through to copy if share failed for other reasons.
          await copyLink(created);
        }
      } else {
        await copyLink(created);
      }
    } catch {
      setError("Could not create a share link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(created?: { id: string; url: string }): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const link = created ?? (await ensureUrl());
      if (!navigator.clipboard?.writeText) {
        setError("Clipboard unavailable. Copy the link manually.");
        setSharedUrl(link.url);
        return;
      }
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      trackLinkCopied({ ...analyticsBase, raceId: link.id });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Could not copy the link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className} data-testid="share-race-controls">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className={PRIMARY_BUTTON}
          aria-label="Share race"
          disabled={busy}
          onClick={() => void handleShare()}
          data-testid="share-race-button"
        >
          Share Race
        </button>
        <button
          type="button"
          className={ACTION_BUTTON}
          aria-label="Copy race link"
          disabled={busy}
          onClick={() => void copyLink()}
          data-testid="copy-link-button"
        >
          {copied ? "Link copied" : "Copy Link"}
        </button>
      </div>
      {sharedUrl ? (
        <p className="mt-2 break-all font-sans text-xs text-muted" data-testid="share-url-preview">
          {sharedUrl}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 font-sans text-xs text-brand-red" role="alert" data-testid="share-error">
          {error}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite" data-testid="share-status">
        {copied ? "Link copied to clipboard" : ""}
      </p>
    </div>
  );
}
