export const colors = {
  brandNavy: "#0F182F",
  nearBlack: "#111318",
  brandRed: "#E10A1F",
  brandRedHover: "#C9081B",
  brandRedTint: "#FDECEE",
  athleteA: "#0470FC",
  athleteADark: "#005BD6",
  athleteATint: "#EAF3FF",
  athleteB: "#FB5A03",
  athleteBDark: "#DC4800",
  athleteBTint: "#FFF0E7",
  track: "#E15B56",
  trackDark: "#C94D4F",
  trackLight: "#ED7771",
  trackHighlight: "#F3A09B",
  trackEdge: "#F4D7D5",
  laneLine: "#FFFFFF",
  infield: "#C9D2A1",
  infieldLight: "#D5DDB5",
  infieldDark: "#BCC68D",
  page: "#FEFEFE",
  card: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#EEF0F3",
  divider: "#E2E4E7",
  inputBorder: "#E6E8EC",
  muted: "#667085",
  metadata: "#8A9099",
  label: "#A4A9B1",
  gold: "#D99800",
  goldHighlight: "#F4B51A",
} as const;

export const radii = {
  card: "8px",
  control: "6px",
} as const;

export const shadows = {
  card: "0 3px 12px rgba(15, 24, 47, 0.06)",
  raised: "0 4px 18px rgba(15, 24, 47, 0.07)",
} as const;

export const athleteColors = {
  A: colors.athleteA,
  B: colors.athleteB,
} as const;
