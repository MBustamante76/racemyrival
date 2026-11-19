import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetupKeyboardGuard } from "@/components/setupKeyboardGuard";

describe("SetupKeyboardGuard", () => {
  afterEach(() => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
  });

  it("freezes document scroll while a setup input is focused", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
    window.scrollTo = vi.fn();
    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="Alex" />
      </SetupKeyboardGuard>,
    );

    const input = screen.getByLabelText("Enter your name");
    await user.click(input);
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-120px");

    input.blur();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120);
  });
});

