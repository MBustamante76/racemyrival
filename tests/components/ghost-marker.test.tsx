import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { TrackRenderer } from "@/components/TrackRenderer";
import { ghostAthletesFromSnapshot } from "@/components/ghostFromSnapshot";
import { athleteMarkerLayouts } from "@/components/trackView";
import type { RaceLoopDependencies } from "@/runtime/createRaceLoop";
import { setFinishingTimes } from "../helpers/finishing-time";

const field = [
  { id: "A", name: "Marcelo", distanceCoveredM: 200 },
  { id: "B", name: "Josh", distanceCoveredM: 400 },
];

function createFakeLoopClock() {
  let now = 0;
  const queued: Array<(time: number) => void> = [];

  return {
    dependencies: {
      now: () => now,
      requestFrame: (callback) => {
        queued.push(callback);
        return queued.length;
      },
      cancelFrame: () => {
        queued.length = 0;
      },
    } satisfies RaceLoopDependencies,
    advance(addElapsedMs: number): void {
      act(() => {
        let remainingMs = addElapsedMs;
        while (remainingMs > 0) {
          const stepMs = Math.min(100, remainingMs);
          now += stepMs;
          remainingMs -= stepMs;
          const frame = queued.shift();
          if (!frame) {
            throw new Error("Expected a scheduled race frame");
          }
          frame(now);
        }
      });
    },
  };
}

describe("winner-gap ghost marker", () => {
  it("places a ghost from the frozen snapshot, not live distance", () => {
    const ghosts = ghostAthletesFromSnapshot(field, {
      winnerId: "B",
      athletes: [
        { id: "A", distanceM: 200 },
        { id: "B", distanceM: 400 },
      ],
    });
    expect(ghosts).toEqual([{ id: "A", name: "Marcelo", distanceCoveredM: 200 }]);

    const later = field.map((athlete) =>
      athlete.id === "A" ? { ...athlete, distanceCoveredM: 320 } : athlete,
    );
    expect(ghostAthletesFromSnapshot(later, {
      winnerId: "B",
      athletes: [
        { id: "A", distanceM: 200 },
        { id: "B", distanceM: 400 },
      ],
    })[0]?.distanceCoveredM).toBe(200);
  });

  it("does not create a ghost for a tie", () => {
    expect(
      ghostAthletesFromSnapshot(field, {
        winnerId: null,
        athletes: [
          { id: "A", distanceM: 400 },
          { id: "B", distanceM: 400 },
        ],
      }),
    ).toEqual([]);
  });

  it("renders the ghost in the runner-up lane and keeps it still", () => {
    const ghosts = ghostAthletesFromSnapshot(field, {
      winnerId: "B",
      athletes: [
        { id: "A", distanceM: 200 },
        { id: "B", distanceM: 400 },
      ],
    });
    const expected = athleteMarkerLayouts(400, ghosts, ["A", "B"])[0];

    const { rerender } = render(
      <TrackRenderer raceDistanceM={400} athletes={field} ghosts={ghosts} />,
    );
    const ghost = screen.getByTestId("athlete-ghost-A");
    expect(ghost).toHaveAttribute("data-distance-covered-m", "200");
    expect(ghost).toHaveAttribute("data-lane-number", "1");
    expect(ghost.querySelector("circle")?.getAttribute("cx")).toBe(String(expected?.marker.x));
    expect(ghost.querySelector("circle")?.getAttribute("cy")).toBe(String(expected?.marker.y));
    expect(screen.queryByTestId("athlete-ghost-B")).not.toBeInTheDocument();

    rerender(
      <TrackRenderer
        raceDistanceM={400}
        athletes={[
          { id: "A", name: "Marcelo", distanceCoveredM: 320 },
          { id: "B", name: "Josh", distanceCoveredM: 400 },
        ]}
        ghosts={ghosts}
      />,
    );
    expect(screen.getByTestId("athlete-ghost-A")).toHaveAttribute("data-distance-covered-m", "200");
    expect(screen.getByTestId("athlete-marker-A").closest("g")).toHaveAttribute(
      "data-distance-covered-m",
      "320",
    );
  });

  it("appears at first finish, stays after both finish, and clears on reset", async () => {
    const clock = createFakeLoopClock();
    const user = userEvent.setup();
    render(<RaceWorkspace loopDependencies={clock.dependencies} />);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await setFinishingTimes(user, "1.00", "0.50");
    await user.click(screen.getByRole("button", { name: "Start race" }));

    expect(screen.queryByTestId("athlete-ghost-A")).not.toBeInTheDocument();
    clock.advance(500);
    expect(screen.getByTestId("athlete-ghost-A")).toHaveAttribute("data-distance-covered-m", "200");
    expect(screen.queryByTestId("athlete-ghost-B")).not.toBeInTheDocument();

    clock.advance(200);
    expect(screen.getByTestId("athlete-ghost-A")).toHaveAttribute("data-distance-covered-m", "200");
    expect(
      Number(
        screen.getByTestId("athlete-marker-A").closest("[data-athlete-id='A']")?.getAttribute(
          "data-distance-covered-m",
        ),
      ),
    ).toBeGreaterThan(200);

    clock.advance(300);
    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.getByTestId("athlete-ghost-A")).toHaveAttribute("data-distance-covered-m", "200");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByTestId("athlete-ghost-A")).not.toBeInTheDocument();
  });
});
