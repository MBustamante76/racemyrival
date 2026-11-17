import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { raceDistanceById } from "@/domain/race";
import { getCampaignById, getActiveCampaign } from "@/partners/campaigns";
import { getSharedRace, isOpaqueRaceId } from "@/server/sharedRace";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

function truncateName(name: string, max = 18): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  const race = isOpaqueRaceId(id) ? await getSharedRace(id) : null;

  const nameA = truncateName(race?.competitorA.displayName || "Athlete A");
  const nameB = truncateName(race?.competitorB.displayName || "Athlete B");
  const distanceLabel = race
    ? (raceDistanceById(race.distanceId)?.label ?? `${race.distanceM}m`)
    : "Race";

  const campaign =
    (race?.campaignId ? getCampaignById(race.campaignId) : null) ?? getActiveCampaign();
  const attribution =
    campaign?.placements.socialCard?.attribution ?? campaign?.attribution ?? null;

  const wordmarkSrc = `data:image/png;base64,${(
    await readFile(join(process.cwd(), "public/brand/race-my-rival-wordmark-colour.png"))
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #0F182F 0%, #1a2744 55%, #0F182F 100%)",
          color: "#FEFEFE",
          padding: "40px 48px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            background: "#FEFEFE",
            borderRadius: 16,
            padding: "20px 36px",
            alignSelf: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og ImageResponse */}
          <img
            src={wordmarkSrc}
            width={380}
            height={76}
            alt="Race My Rival"
            style={{ objectFit: "contain" }}
          />
          <div style={{ display: "flex", fontSize: 20, color: "#0F182F", fontWeight: 600 }}>
            Turn times into races.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontSize: 56,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#008C95" }}>{nameA}</span>
            <span style={{ fontSize: 28, letterSpacing: "0.16em" }}>VS</span>
            <span style={{ color: "#6A50A7" }}>{nameB}</span>
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{distanceLabel}</div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#E10A1F",
            }}
          >
            Who won?
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: 22,
            color: "#A4A9B1",
          }}
        >
          {attribution || "racemyrival.com"}
        </div>
      </div>
    ),
    { ...size },
  );
}
