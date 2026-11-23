import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandHeader } from "@/components/PartnerShell";

describe("BrandHeader home reset", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigates home like Create New Race when the logo is activated", async () => {
    const user = userEvent.setup();
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });

    render(<BrandHeader />);
    await user.click(screen.getByTestId("brand-logo-link"));
    expect(assign).toHaveBeenCalledWith("/");
  });
});
