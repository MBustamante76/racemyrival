import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SetupKeyboardGuard } from "@/components/setupKeyboardGuard";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import { mockLayoutMedia } from "../helpers/match-media";

describe("SetupKeyboardGuard — iOS keyboard regression", () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLayoutMedia({ desktop: false, landscape: false });
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not pin the wrapper or body when a field focuses", async () => {
    const user = userEvent.setup();
    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="" />
      </SetupKeyboardGuard>,
    );

    const input = screen.getByLabelText("Enter your name");
    await user.click(input);

    expect(input).toHaveFocus();
    const guard = screen.getByTestId("setup-keyboard-guard");
    expect(guard).not.toHaveAttribute("data-kb-pinned");
    expect(guard.style.position).not.toBe("fixed");
    expect(getComputedStyle(guard).position).not.toBe("fixed");
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(screen.queryByTestId("setup-keyboard-spacer")).not.toBeInTheDocument();
  });

  it("does not call scrollIntoView on the focused field (that drops the iOS keyboard)", async () => {
    const user = userEvent.setup();
    render(
      <SetupKeyboardGuard>
        <input aria-label="Enter your name" defaultValue="" />
      </SetupKeyboardGuard>,
    );

    await user.click(screen.getByLabelText("Enter your name"));

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Enter your name")).toHaveFocus();
  });

  it("keeps name-field focus while typing inside the real setup card", async () => {
    const user = userEvent.setup();
    render(<RaceWorkspace />);

    const you = screen.getByLabelText("Enter your name");
    await user.click(you);
    expect(you).toHaveFocus();

    await user.type(you, "Alex");
    expect(you).toHaveFocus();
    expect(you).toHaveValue("Alex");
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(screen.getByTestId("setup-keyboard-guard").style.position).not.toBe("fixed");
  });
});
