import type { ParseRaceTimeError, ParseRaceTimeResult } from "./types";

function fail(error: ParseRaceTimeError): ParseRaceTimeResult {
  return { ok: false, error };
}

function secondsTokenToMs(token: string): number | null {
  if (!/^\d+\.\d+$/.test(token) && !/^\d+$/.test(token)) {
    return null;
  }

  const [wholeText, fractionText = ""] = token.split(".");
  const wholeSeconds = Number(wholeText);
  if (!Number.isFinite(wholeSeconds)) {
    return null;
  }

  const paddedFraction = `${fractionText}000`.slice(0, 3);
  const fractionMs = Number(paddedFraction);
  if (!Number.isFinite(fractionMs)) {
    return null;
  }

  return wholeSeconds * 1000 + fractionMs;
}

export function parseRaceTime(input: string): ParseRaceTimeResult {
  if (typeof input !== "string") {
    return fail("non_numeric");
  }

  const trimmed = input.trim();
  if (trimmed === "") {
    return fail("blank");
  }

  if (trimmed.startsWith("-")) {
    return fail("negative");
  }

  if (/\s/.test(trimmed) || !/^[0-9:.]+$/.test(trimmed)) {
    return fail("non_numeric");
  }

  if (trimmed.includes("::") || trimmed.startsWith(":") || trimmed.endsWith(":")) {
    return fail("malformed");
  }

  const parts = trimmed.split(":");
  if (parts.length > 2) {
    return fail("malformed");
  }

  if (parts.length === 1) {
    const milliseconds = secondsTokenToMs(parts[0]);
    if (milliseconds === null) {
      return fail("non_numeric");
    }
    if (milliseconds < 0) {
      return fail("negative");
    }
    if (milliseconds === 0) {
      return fail("zero");
    }
    return { ok: true, milliseconds };
  }

  const minutesToken = parts[0];
  if (!/^\d+$/.test(minutesToken)) {
    return fail("malformed");
  }

  const secondsMs = secondsTokenToMs(parts[1]);
  if (secondsMs === null) {
    return fail("non_numeric");
  }
  if (secondsMs >= 60_000) {
    return fail("seconds_out_of_range");
  }

  const totalMs = Number(minutesToken) * 60_000 + secondsMs;
  if (totalMs < 0) {
    return fail("negative");
  }
  if (totalMs === 0) {
    return fail("zero");
  }

  return { ok: true, milliseconds: totalMs };
}

export function formatRaceTime(milliseconds: number): string {
  const totalHundredths = Math.round(milliseconds / 10);
  const minutes = Math.floor(totalHundredths / 6_000);
  const remainder = totalHundredths % 6_000;
  const seconds = Math.floor(remainder / 100);
  const hundredths = remainder % 100;
  const fraction = hundredths.toString().padStart(2, "0");

  if (minutes === 0) {
    return `${seconds}.${fraction}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${fraction}`;
}
