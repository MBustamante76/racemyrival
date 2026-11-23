import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SETUP_KEYBOARD_ATTR, SetupKeyboardGuard } from "@/components/setupKeyboardGuard";

describe("SetupKeyboardGuard", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(SETUP_KEYBOARD_ATTR);
  });

  it("marks the document while a setup input is focused without freezing the body", async () => {
    const user = userEvent.setup();
    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="" />
      </SetupKeyboardGuard>,
    );

    const input = screen.getByLabelText("Enter your name");
    await user.click(input);
    expect(document.documentElement.getAttribute(SETUP_KEYBOARD_ATTR)).toBe("true");
    expect(document.body.style.position).toBe("");
    expect(document.body.style.transform).toBe("");

    input.blur();
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(document.documentElement.hasAttribute(SETUP_KEYBOARD_ATTR)).toBe(false);
  });
});
