import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { raceDistanceById } from "@/domain/race";
import { getSharedRace, isOpaqueRaceId } from "@/server/sharedRace";
import { shareNameFontSize, truncateShareName } from "./shareCardText";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

/** Source plate is 1731×909; OG canvas is 1200×630. */
const SX = 1200 / 1731;
const SY = 630 / 909;

const TEAL = "#00959B";
const PURPLE = "#7250A4";
const NAVY = "#0F182F";
const CORAL = "#EF5B4C";

const chewyRegular = readFile(join(process.cwd(), "src/fonts/Chewy-Regular.ttf"));
const shareCardBackground = readFile(
  join(process.cwd(), "public/brand/share-card-background.png"),
);

function plate(x: number, y: number, w: number, h: number) {
  return {
    left: Math.round(x * SX),
    top: Math.round(y * SY),
    width: Math.round(w * SX),
    height: Math.round(h * SY),
  };
}

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  const race = isOpaqueRaceId(id) ? await getSharedRace(id) : null;

  const nameA = truncateShareName(race?.competitorA.displayName || "Athlete A");
  const nameB = truncateShareName(race?.competitorB.displayName || "Athlete B");
  const fontA = shareNameFontSize(nameA);
  const fontB = shareNameFontSize(nameB);
  const distanceLabel = race
    ? (raceDistanceById(race.distanceId)?.label ?? `${race.distanceM}m`)
    : "Race";

  const [backgroundBytes, chewyBytes] = await Promise.all([
    shareCardBackground,
    chewyRegular,
  ]);
  const backgroundSrc = `data:image/png;base64,${backgroundBytes.toString("base64")}`;

  // Stacked in the oval infield: names → distance → who won → Watch the race.
  const leftPill = plate(270, 300, 450, 130);
  const rightPill = plate(1010, 300, 450, 130);
  const vsBox = plate(800, 330, 130, 80);
  const distanceBox = plate(680, 460, 370, 90);
  const whoWonBox = plate(720, 555, 290, 55);
  const watchButton = plate(600, 625, 530, 95);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Chewy",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og ImageResponse */}
        <img
          src={backgroundSrc}
          width={1200}
          height={630}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            objectFit: "contain",
            background: "#FFFFFF",
          }}
        />

        <div
          style={{
            position: "absolute",
            ...leftPill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 18,
            paddingRight: 18,
            background: TEAL,
            borderRadius: 999,
            color: "#FFFFFF",
            fontSize: fontA,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {nameA}
        </div>

        <div
          style={{
            position: "absolute",
            ...vsBox,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: NAVY,
            fontSize: 40,
            lineHeight: 1,
          }}
        >
          vs
        </div>

        <div
          style={{
            position: "absolute",
            ...rightPill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 18,
            paddingRight: 18,
            background: PURPLE,
            borderRadius: 999,
            color: "#FFFFFF",
            fontSize: fontB,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {nameB}
        </div>

        <div
          style={{
            position: "absolute",
            ...distanceBox,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: NAVY,
            fontSize: 64,
            lineHeight: 1,
          }}
        >
          {distanceLabel}
        </div>

        <div
          style={{
            position: "absolute",
            ...whoWonBox,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: NAVY,
            fontSize: 34,
            lineHeight: 1,
          }}
        >
          Who won?
        </div>

        <div
          style={{
            position: "absolute",
            ...watchButton,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: CORAL,
            borderRadius: 999,
            color: "#FFFFFF",
            fontSize: 34,
            lineHeight: 1,
          }}
        >
          Watch the race ›
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Chewy",
          data: chewyBytes,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
