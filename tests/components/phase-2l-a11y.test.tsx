import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";

describe("Phase 2L accessibility", () => {
  it("exposes live clock and status, and keeps keyboard access to start", async () => {
    const user = userEvent.setup();
    render(<RaceWorkspace />);

    expect(screen.getByTestId("race-clock")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("race-status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("athlete-distance-A")).toBeInTheDocument();
    expect(screen.getByTestId("athlete-distance-B")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByLabelText("Race distance")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
  });
});
