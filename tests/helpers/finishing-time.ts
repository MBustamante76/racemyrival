import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { timePartsFromMilliseconds } from "@/components/raceSession";
import { parseRaceTime } from "@/domain/race";

export async function setFinishingTimes(
  user: ReturnType<typeof userEvent.setup>,
  timeA: string,
  timeB: string,
): Promise<void> {
  await setFinishingTime(user, "Athlete A", timeA);
  await setFinishingTime(user, "Athlete B", timeB);
}

export async function setFinishingTime(
  user: ReturnType<typeof userEvent.setup>,
  athleteLabel: "Athlete A" | "Athlete B",
  timeText: string,
): Promise<void> {
  const parsed = parseRaceTime(timeText);
  if (!parsed.ok) {
    throw new Error(`Test time must be a valid race time: ${timeText}`);
  }

  const parts = timePartsFromMilliseconds(parsed.milliseconds);
  await fillPart(user, `${athleteLabel} minutes`, parts.minutes);
  await fillPart(user, `${athleteLabel} seconds`, parts.seconds);
  await fillPart(user, `${athleteLabel} hundredths`, parts.hundredths);
}

async function fillPart(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string,
): Promise<void> {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  if (value !== "") {
    await user.type(input, value);
  }
}
