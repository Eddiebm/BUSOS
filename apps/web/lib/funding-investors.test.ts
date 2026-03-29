import { describe, expect, it } from "vitest";
import { FUNDING_INVESTORS, matchInvestorsForVenture } from "./funding-investors";

describe("funding-investors", () => {
  it("has at least 50 directory entries", () => {
    expect(FUNDING_INVESTORS.length).toBeGreaterThanOrEqual(50);
  });

  it("matchInvestorsForVenture returns ordered list", () => {
    const m = matchInvestorsForVenture({
      stage: 5,
      name: "Fintech Co",
      stressMode: "EXECUTION",
      industryVertical: "Fintech",
    });
    expect(m.length).toBe(FUNDING_INVESTORS.length);
    expect(m[0]).toHaveProperty("name");
    expect(m[0]).toHaveProperty("website");
  });
});
