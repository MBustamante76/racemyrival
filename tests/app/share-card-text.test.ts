import { describe, expect, it } from "vitest";
import { shareNameFontSize, truncateShareName } from "@/app/race/[id]/shareCardText";

describe("share card text", () => {
  it("keeps short names intact", () => {
    expect(truncateShareName("Ella")).toBe("Ella");
    expect(truncateShareName("  Josh  ")).toBe("Josh");
  });

  it("truncates long names for pill width", () => {
    expect(truncateShareName("Anelise Maximilienne")).toBe("Anelise Maximil…");
    expect(truncateShareName("Anelise Maximilienne").length).toBe(16);
  });

  it("scales font size down as names get longer", () => {
    expect(shareNameFontSize("Ella")).toBe(48);
    expect(shareNameFontSize("Anelise")).toBe(48);
    expect(shareNameFontSize("Christopher")).toBe(40);
    expect(shareNameFontSize("Anelise Maximili")).toBe(32);
    expect(shareNameFontSize("Anelise Maximili…")).toBe(28);
  });
});
