import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // next/image is a Next runtime primitive; jsdom only needs the img.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

describe("Home page (React Testing Library)", () => {
  it("renders the scaffold heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /edit the page\.tsx file/i }),
    ).toBeInTheDocument();
  });

  it("renders the Next.js logo", () => {
    render(<Home />);

    expect(screen.getByRole("img", { name: "Next.js logo" })).toBeInTheDocument();
  });

  it("renders deploy and documentation links", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /deploy now/i })).toHaveAttribute(
      "href",
      expect.stringContaining("vercel.com"),
    );
    expect(screen.getByRole("link", { name: /documentation/i })).toHaveAttribute(
      "href",
      expect.stringContaining("nextjs.org/docs"),
    );
  });
});
