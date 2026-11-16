import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SharedRaceExperience, SharedRaceUnavailable } from "@/components/SharedRaceExperience";
import { timePartsFromMilliseconds } from "@/components/raceSession";

const track = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => track(...args),
}));

const draft = {
  distanceId: "800",
  athletes: [
    { id: "A", name: "JAVI", time: timePartsFromMilliseconds(144_000) },
    { id: "B", name: "JOEY", time: timePartsFromMilliseconds(148_000) },
  ] as [
    { id: string; name: string; time: ReturnType<typeof timePartsFromMilliseconds> },
    { id: string; name: string; time: ReturnType<typeof timePartsFromMilliseconds> },
  ],
};

describe("shared race landing", () => {
  beforeEach(() => {
    track.mockClear();
  });

  it("shows names and distance without winner before watch", () => {
    render(
      <SharedRaceExperience
        raceId="abcdefghijklmnopqrstu"
        draft={draft}
        nameA="JAVI"
        nameB="JOEY"
        distanceId="800"
        distanceM={800}
      />,
    );

    expect(screen.getByTestId("shared-race-landing")).toBeInTheDocument();
    expect(screen.getByTestId("shared-race-names")).toHaveTextContent("JAVI");
    expect(screen.getByTestId("shared-race-names")).toHaveTextContent("JOEY");
    expect(screen.getByTestId("shared-race-distance")).toHaveTextContent("800m");
    expect(screen.queryByTestId("result-winner")).not.toBeInTheDocument();
    expect(screen.queryByText(/wins/i)).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      "shared_race_opened",
      expect.objectContaining({ raceId: "abcdefghijklmnopqrstu", distanceId: "800" }),
    );
  });

  it("reveals the player after Watch Race", async () => {
    const user = userEvent.setup();
    render(
      <SharedRaceExperience
        raceId="abcdefghijklmnopqrstu"
        draft={draft}
        nameA="JAVI"
        nameB="JOEY"
        distanceId="800"
        distanceM={800}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Watch race" }));
    expect(screen.getByTestId("shared-race-player")).toBeInTheDocument();
    expect(screen.queryByTestId("shared-race-landing")).not.toBeInTheDocument();
  });

  it("shows unavailable state with create CTA", () => {
    render(<SharedRaceUnavailable />);
    expect(screen.getByTestId("shared-race-unavailable")).toHaveTextContent(
      "This race is no longer available.",
    );
    expect(screen.getByTestId("create-new-race-link")).toHaveAttribute("href", "/");
  });
});
