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
  props: RaceAnalyticsProps & { playbackRate: number },
): void {
  track("Race Completed", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
    playbackRate: props.playbackRate,
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

/** Call once Share is functional — keep payload free of personal data. */
export function trackShareResult(props: RaceAnalyticsProps): void {
  track("Share Result", {
    distanceId: props.distanceId,
    distanceM: props.distanceM,
  });
}
