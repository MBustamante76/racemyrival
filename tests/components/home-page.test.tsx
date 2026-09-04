import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page (React Testing Library)", () => {
  it("renders the prototype heading", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Race My Rival" })).toBeInTheDocument();
  });

  it("renders the track geometry preview", () => {
    render(<Home />);

    expect(
      screen.getByRole("img", { name: "400 metre stadium racing line" }),
    ).toBeInTheDocument();
  });
});
