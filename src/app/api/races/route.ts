import { NextResponse } from "next/server";
import { getActiveCampaign } from "@/partners/campaigns";
import {
  createSharedRace,
  validateCreateSharedRaceInput,
} from "@/server/sharedRace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = validateCreateSharedRaceInput(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.error, field: validated.field },
      { status: 400 },
    );
  }

  const active = getActiveCampaign();
  const campaignId =
    validated.value.campaignId !== undefined
      ? validated.value.campaignId
      : (active?.id ?? null);

  try {
    const race = await createSharedRace({
      ...validated.value,
      campaignId,
    });
    const url = new URL(`/race/${race.id}`, request.url).toString();
    return NextResponse.json(
      {
        id: race.id,
        url,
        createdAt: race.createdAt,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to save race" },
      { status: 503 },
    );
  }
}
