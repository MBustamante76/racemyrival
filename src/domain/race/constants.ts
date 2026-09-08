export const METRES_PER_MILE = 1609.344;
export const CANONICAL_LAP_M = 400;
export const PHASE1_ATHLETE_COUNT = 2;
export const DEFAULT_PLAYBACK_RATE = 1;
export const PLAYBACK_RATES = [1, 2, 4, 8] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];
export const MAX_FRAME_DELTA_MS = 100;
