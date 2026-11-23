import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SETUP_KEYBOARD_ATTR, SetupKeyboardGuard } from "@/components/setupKeyboardGuard";

describe("SetupKeyboardGuard", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(SETUP_KEYBOARD_ATTR);
  });

  it("pins the setup block without freezing the document body", async () => {
    const user = userEvent.setup();
    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="" />
      </SetupKeyboardGuard>,
    );

    const input = screen.getByLabelText("Enter your name");
    await user.click(input);

    const guard = screen.getByTestId("setup-keyboard-guard");
    expect(guard).toHaveAttribute("data-kb-pinned", "true");
    expect(document.documentElement.getAttribute(SETUP_KEYBOARD_ATTR)).toBe("true");
    expect(screen.getByTestId("setup-keyboard-spacer")).toBeInTheDocument();
    expect(document.body.style.position).toBe("");
    expect(document.body.style.transform).toBe("");

    input.blur();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(guard).not.toHaveAttribute("data-kb-pinned");
    expect(document.documentElement.hasAttribute(SETUP_KEYBOARD_ATTR)).toBe(false);
    expect(screen.queryByTestId("setup-keyboard-spacer")).not.toBeInTheDocument();
  });
});
