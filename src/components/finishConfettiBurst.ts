const FINISH_CONFETTI_COLORS = ["#e10a1f", "#0470fc", "#fb5a03", "#ffffff", "#0a2540"];

/** Dual side bursts via @tsparticles/confetti (confetti.js.org), scoped to a canvas. */
export async function fireFinishConfetti(canvas: HTMLCanvasElement): Promise<void> {
  const { confetti } = await import("@tsparticles/confetti");
  const fire = await confetti.create(canvas, {
    count: 80,
    spread: 70,
    startVelocity: 42,
    gravity: 1.1,
    ticks: 220,
    colors: FINISH_CONFETTI_COLORS,
    disableForReducedMotion: true,
    zIndex: 20,
  });

  await Promise.all([
    fire({
      count: 70,
      angle: 60,
      spread: 58,
      position: { x: 12, y: 72 },
      colors: FINISH_CONFETTI_COLORS,
    }),
    fire({
      count: 70,
      angle: 120,
      spread: 58,
      position: { x: 88, y: 72 },
      colors: FINISH_CONFETTI_COLORS,
    }),
  ]);
}
