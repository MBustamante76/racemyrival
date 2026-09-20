/** Delay after finish before the results card slides in. Zero under Vitest so finish tests stay sync. */
export const RESULT_REVEAL_DELAY_MS =
  typeof process !== "undefined" && process.env.VITEST ? 0 : 2500;

export function resolveResultRevealDelayMs(prefersReducedMotion: boolean): number {
  if (prefersReducedMotion) {
    return 0;
  }
  return RESULT_REVEAL_DELAY_MS;
}
