import { RESULT_REVEAL_DELAY_MS, resolveResultRevealDelayMs } from "@/components/resultReveal";
import { describe, expect, it } from "vitest";

describe("result reveal delay", () => {
  it("is zero under Vitest so finish UI tests stay synchronous", () => {
    expect(RESULT_REVEAL_DELAY_MS).toBe(0);
    expect(resolveResultRevealDelayMs(false)).toBe(0);
  });

  it("skips the wait when reduced motion is preferred", () => {
    expect(resolveResultRevealDelayMs(true)).toBe(0);
  });
});
