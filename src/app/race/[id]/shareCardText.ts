/** Fit competitor names into OG share-card pills. */
export function truncateShareName(name: string, max = 16): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Scale Chewy pill type so longer names still fit. */
export function shareNameFontSize(name: string): number {
  const length = name.trim().length;
  if (length <= 8) {
    return 48;
  }
  if (length <= 12) {
    return 40;
  }
  if (length <= 16) {
    return 32;
  }
  return 28;
}
