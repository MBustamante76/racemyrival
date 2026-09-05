import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page (React Testing Library)", () => {
  it("renders the prototype heading", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Race My Rival" })).toBeInTheDocument();
  });

  it("renders the track with both fixture athletes", () => {
    render(<Home />);

    expect(screen.getByRole("img", { name: "400 metre stadium race track" })).toBeInTheDocument();
    expect(screen.getByTestId("athlete-label-A")).toHaveTextContent("Marcelo");
    expect(screen.getByTestId("athlete-label-B")).toHaveTextContent("Josh");
  });
});
