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
    document.body.style.transform = "";
  });

  it("freezes document scroll in place while a setup input is focused", async () => {
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
    expect(document.body.style.transform).toBe("");
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120);
  });

  it("counters visualViewport pan without shifting the locked scroll top", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 40 });
    window.scrollTo = vi.fn();

    const listeners = new Map<string, EventListener>();
    const visualViewport = {
      offsetTop: 0,
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });

    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="Alex" />
      </SetupKeyboardGuard>,
    );

    await user.click(screen.getByLabelText("Enter your name"));
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-40px");

    visualViewport.offsetTop = 180;
    listeners.get("scroll")?.(new Event("scroll"));
    expect(document.body.style.transform).toBe("translateY(180px)");
    expect(document.body.style.top).toBe("-40px");
  });
});
