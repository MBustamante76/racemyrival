import { beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => track(...args),
}));

describe("privacy-safe race analytics", () => {
  beforeEach(() => {
    track.mockClear();
  });

  it("tracks usage events without athlete names or finish times", async () => {
    const {
      trackPlaybackSpeed,
      trackRaceAgain,
      trackRaceCompleted,
      trackRaceStarted,
      trackReplay,
      trackShareResult,
    } = await import("@/components/analytics");

    trackRaceStarted({ distanceId: "800", distanceM: 800, playbackRate: 5 });
    trackRaceCompleted({ distanceId: "800", distanceM: 800, playbackRate: 5 });
    trackRaceAgain({ distanceId: "800", distanceM: 800 });
    trackReplay({ distanceId: "mile", distanceM: 1609.344 });
    trackPlaybackSpeed({ distanceId: "1500", playbackRate: 10 });
    trackShareResult({ distanceId: "400", distanceM: 400 });

    expect(track).toHaveBeenCalledTimes(6);
    for (const [, payload] of track.mock.calls) {
      const keys = Object.keys(payload as Record<string, unknown>);
      expect(keys.some((key) => /name|athlete|time|email/i.test(key))).toBe(false);
    }

    expect(track).toHaveBeenCalledWith("Race Started", {
      distanceId: "800",
      distanceM: 800,
      playbackRate: 5,
    });
    expect(track).toHaveBeenCalledWith("Share Result", {
      distanceId: "400",
      distanceM: 400,
    });
  });
});
