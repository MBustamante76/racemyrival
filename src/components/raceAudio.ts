const START_GUN_SRC = "/audio/starting_gun.mp3";
const FINISH_CHEER_SRC = "/audio/crowd_cheering.mp3";

let startGun: HTMLAudioElement | null = null;
let finishCheer: HTMLAudioElement | null = null;

function createAudio(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = "auto";
  try {
    audio.load();
  } catch {
    // load() can fail offline / in tests
  }
  return audio;
}

/** Warm the audio elements so Start (user gesture) unlocks playback for later cheer too. */
export function preloadRaceAudio(): void {
  if (typeof window === "undefined") {
    return;
  }
  startGun ??= createAudio(START_GUN_SRC);
  finishCheer ??= createAudio(FINISH_CHEER_SRC);
}

function play(audio: HTMLAudioElement | null, volume: number): void {
  if (!audio) {
    return;
  }
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    void audio.play().catch(() => {
      // Autoplay may still be blocked in some browsers.
    });
  } catch {
    // Restricted environments / missing media support.
  }
}

export function playStartGun(): void {
  preloadRaceAudio();
  play(startGun, 0.85);
}

export function playFinishCheer(): void {
  preloadRaceAudio();
  play(finishCheer, 0.7);
}

/** Delay after the gun before athletes start moving. Zero under Vitest so race-frame tests stay synchronous. */
export const START_GUN_LEAD_MS =
  typeof process !== "undefined" && process.env.VITEST ? 0 : 220;
