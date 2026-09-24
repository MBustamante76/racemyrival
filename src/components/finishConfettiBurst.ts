const FINISH_CONFETTI_COLORS = ["#e10a1f", "#008c95", "#6a50a7", "#ffffff", "#0a2540"];

/** Dual side bursts via @tsparticles/confetti (confetti.js.org). */
export async function fireFinishConfetti(): Promise<void> {
  const { confetti } = await import("@tsparticles/confetti");

  // Distinct canvas ids — parallel bursts with the default id cancel each other.
  await Promise.all([
    confetti("rmr-finish-left", {
      count: 100,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      gravity: 1.05,
      ticks: 260,
      position: { x: 15, y: 70 },
      colors: FINISH_CONFETTI_COLORS,
      zIndex: 1000,
    }),
    confetti("rmr-finish-right", {
      count: 100,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      gravity: 1.05,
      ticks: 260,
      position: { x: 85, y: 70 },
      colors: FINISH_CONFETTI_COLORS,
      zIndex: 1000,
    }),
  ]);
}
