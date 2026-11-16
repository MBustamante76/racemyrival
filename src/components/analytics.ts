import { track } from "@vercel/analytics";

/**
 * Privacy-safe product analytics via Vercel Web Analytics.
 * Never send athlete names, times, or other personal fields.
 */
export type RaceAnalyticsProps = {
  distanceId: string;
  distanceM: number;
};

export function trackRaceStarted(
  props: RaceAnalyticsProps & { playbackRate: number },
): void {
  track("Race Started", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    playbackRate: props.playbackRate,
  });
}

export function trackRaceCompleted(
  props: RaceAnalyticsProps & { playbackRate: number; raceId?: string },
): void {
  track("Race Completed", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    playbackRate: props.playbackRate,
    ...(props.raceId ? { raceId: props.raceId } : {}),
  });
}

export function trackRaceAgain(props: RaceAnalyticsProps): void {
  track("Race Again", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
  });
}

export function trackReplay(props: RaceAnalyticsProps): void {
  track("Replay", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
  });
}

export function trackPlaybackSpeed(props: {
  playbackRate: number;
  distanceId: string;
}): void {
  track("Playback Speed", {
    playbackRate: props.playbackRate,
    distanceId: props.distanceId,
  });
}

/** @deprecated Prefer share_initiated / link_copied — kept for compatibility. */
export function trackShareResult(props: RaceAnalyticsProps): void {
  track("Share Result", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
  });
}

export function trackShareOpened(
  props: RaceAnalyticsProps & { raceId?: string; shareSurface?: string },
): void {
  track("share_opened", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    ...(props.raceId ? { raceId: props.raceId } : {}),
    ...(props.shareSurface ? { shareSurface: props.shareSurface } : {}),
  });
}

/** Native share sheet presented — does NOT prove the recipient received the link. */
export function trackShareInitiated(
  props: RaceAnalyticsProps & { raceId?: string; shareSurface?: string },
): void {
  track("share_initiated", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    ...(props.raceId ? { raceId: props.raceId } : {}),
    ...(props.shareSurface ? { shareSurface: props.shareSurface } : {}),
  });
}

/**
 * navigator.share() resolved without throw.
 * Still not proof the message was sent — only that the share UI completed.
 */
export function trackShareCompleted(
  props: RaceAnalyticsProps & { raceId?: string; shareSurface?: string },
): void {
  track("share_completed", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    ...(props.raceId ? { raceId: props.raceId } : {}),
    ...(props.shareSurface ? { shareSurface: props.shareSurface } : {}),
  });
}

export function trackLinkCopied(
  props: RaceAnalyticsProps & { raceId?: string },
): void {
  track("link_copied", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    ...(props.raceId ? { raceId: props.raceId } : {}),
  });
}

export function trackSharedRaceOpened(
  props: RaceAnalyticsProps & { raceId: string },
): void {
  track("shared_race_opened", {
    raceId: props.raceId,
    distanceId: props.distanceId,
    distanceM: props.distanceM,
  });
}

export function trackSharedRaceStarted(
  props: RaceAnalyticsProps & { raceId: string; playbackRate: number },
): void {
  track("shared_race_started", {
    raceId: props.raceId,
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    playbackRate: props.playbackRate,
  });
}

export function trackSharedRaceCompleted(
  props: RaceAnalyticsProps & { raceId: string; playbackRate: number },
): void {
  track("shared_race_completed", {
    raceId: props.raceId,
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    playbackRate: props.playbackRate,
  });
}

export function trackFollowOnRaceCreated(
  props: RaceAnalyticsProps & { sourceRaceId?: string },
): void {
  track("follow_on_race_created", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    ...(props.sourceRaceId ? { sourceRaceId: props.sourceRaceId } : {}),
  });
}

export function trackFollowOnRaceShared(
  props: RaceAnalyticsProps & { sourceRaceId?: string; raceId?: string },
): void {
  track("follow_on_race_shared", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    ...(props.sourceRaceId ? { sourceRaceId: props.sourceRaceId } : {}),
    ...(props.raceId ? { raceId: props.raceId } : {}),
  });
}

export function trackPartnerImpression(props: {
  campaignId: string;
  placement: string;
  viewport: string;
}): void {
  track("partner_impression", {
    campaignId: props.campaignId,
    placement: props.placement,
    viewport: props.viewport,
  });
}

export function trackPartnerClick(props: {
  campaignId: string;
  placement: string;
  destination: string;
}): void {
  track("partner_click", {
    campaignId: props.campaignId,
    placement: props.placement,
    destination: props.destination,
  });
}
