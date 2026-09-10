import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RaceApp } from "@/components/RaceApp";
import { resolvePresentationMode } from "@/components/presentation";

describe("Phase 2N wireframe mode", () => {
  it("resolves wireframe from the query string or localStorage", () => {
    expect(resolvePresentationMode("?mode=wireframe", null)).toBe("wireframe");
    expect(resolvePresentationMode("", { getItem: () => "wireframe" })).toBe("wireframe");
    expect(resolvePresentationMode("", { getItem: () => null })).toBe("polished");
    expect(resolvePresentationMode("?mode=polished", { getItem: () => "wireframe" })).toBe("polished");
  });

  it("renders both presentations with the same engine wiring", () => {
    const { unmount } = render(<RaceApp initialMode="polished" />);
    expect(screen.getByTestId("presentation-root")).toHaveAttribute("data-presentation", "polished");
    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
    unmount();

    render(<RaceApp initialMode="wireframe" />);
    expect(screen.getByTestId("presentation-root")).toHaveAttribute("data-presentation", "wireframe");
    expect(screen.queryByTestId("app-header")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
    expect(screen.getByLabelText("Race distance")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toBeInTheDocument();

    const workspace = readFileSync(resolve("src/components/RaceWorkspace.tsx"), "utf8");
    expect(workspace).toContain("createConfiguredRace");
    expect(workspace).toContain("createRaceLoop");
    expect(workspace).not.toContain("new RaceEngine");
  });
});
