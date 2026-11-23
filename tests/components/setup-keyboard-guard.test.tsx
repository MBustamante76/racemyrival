import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SetupKeyboardGuard } from "@/components/setupKeyboardGuard";

describe("SetupKeyboardGuard", () => {
  it("leaves focus alone — no fixed pin or scrollIntoView side effects", async () => {
    const user = userEvent.setup();
    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="" />
      </SetupKeyboardGuard>,
    );

    const input = screen.getByLabelText("Enter your name");
    await user.click(input);

    expect(input).toHaveFocus();
    expect(screen.getByTestId("setup-keyboard-guard")).not.toHaveAttribute("data-kb-pinned");
    expect(document.body.style.position).toBe("");
    expect(screen.queryByTestId("setup-keyboard-spacer")).not.toBeInTheDocument();
  });
});
