import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RaceWorkspace } from "@/components/RaceWorkspace";
import {
  composeTimeText,
  sanitizeSeconds,
  timeFieldError,
  timePartsFromMilliseconds,
} from "@/components/raceSession";
import { parseRaceTime } from "@/domain/race";

describe("finishing time parts", () => {
  it("round-trips the client examples through the same domain parser", () => {
    expect(timePartsFromMilliseconds(10_000)).toEqual({
      minutes: "0",
      seconds: "10",
      hundredths: "00",
    });
    expect(composeTimeText({ minutes: "0", seconds: "10", hundredths: "00" })).toBe("0:10.00");
    expect(parseRaceTime(composeTimeText({ minutes: "1", seconds: "52", hundredths: "43" }))).toEqual({
      ok: true,
      milliseconds: 112_430,
    });
    expect(parseRaceTime(composeTimeText({ minutes: "14", seconds: "37", hundredths: "82" }))).toEqual({
      ok: true,
      milliseconds: 877_820,
    });
  });

  it("rejects a 60-second keystroke instead of accepting 1.05.00-style text", () => {
    expect(sanitizeSeconds("60")).toBe("6");
    expect(sanitizeSeconds("59")).toBe("59");
    expect(timeFieldError({ minutes: "0", seconds: "00", hundredths: "00" })).toBe(
      "Time must be greater than zero",
    );
  });
});

describe("finishing time fields", () => {
  it("defaults to 2:04.00 and 1:52.00 across the three fields", () => {
    render(<RaceWorkspace />);
    expect(screen.getByLabelText("Athlete A minutes")).toHaveValue("2");
    expect(screen.getByLabelText("Athlete A seconds")).toHaveValue("04");
    expect(screen.getByLabelText("Athlete A hundredths")).toHaveValue("00");
    expect(screen.getByLabelText("Athlete B minutes")).toHaveValue("1");
    expect(screen.getByLabelText("Athlete B seconds")).toHaveValue("52");
    expect(screen.getByLabelText("Athlete B hundredths")).toHaveValue("00");
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
    expect(screen.queryByText("Use SS.ff or M:SS.ff")).not.toBeInTheDocument();
  });

  it("lets a user type 1, Tab, 52, Tab, 43", async () => {
    const user = userEvent.setup();
    render(<RaceWorkspace />);
    const minutes = screen.getByLabelText("Athlete A minutes");
    const seconds = screen.getByLabelText("Athlete A seconds");
    const hundredths = screen.getByLabelText("Athlete A hundredths");

    await user.clear(minutes);
    await user.clear(seconds);
    await user.clear(hundredths);
    await user.click(minutes);
    await user.keyboard("1");
    await user.tab();
    expect(seconds).toHaveFocus();
    await user.keyboard("52");
    expect(hundredths).toHaveFocus();
    await user.keyboard("43");

    expect(minutes).toHaveValue("1");
    expect(seconds).toHaveValue("52");
    expect(hundredths).toHaveValue("43");
    expect(screen.getByRole("button", { name: "Start race" })).toBeEnabled();
  });

  it("does not accept 60 seconds", async () => {
    const user = userEvent.setup();
    render(<RaceWorkspace />);
    const seconds = screen.getByLabelText("Athlete A seconds");
    await user.clear(seconds);
    await user.type(seconds, "60");
    expect(seconds).toHaveValue("6");
  });
});
