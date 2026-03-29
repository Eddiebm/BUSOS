import { describe, expect, it } from "vitest";
import { MILESTONE_CATEGORY_ORDER, sortJourneyMilestones } from "./sort-milestones";

describe("sortJourneyMilestones", () => {
  it("orders by category rank then order field", () => {
    const rows = [
      { category: "GROWTH", order: 1 },
      { category: "VALIDATION", order: 99 },
      { category: "PRODUCT", order: 1 },
    ];
    const sorted = sortJourneyMilestones(rows);
    expect(sorted.map((r) => r.category)).toEqual(["VALIDATION", "PRODUCT", "GROWTH"]);
  });

  it("sorts by order within the same category", () => {
    const rows = [
      { category: "LEGAL", order: 3 },
      { category: "LEGAL", order: 1 },
    ];
    const sorted = sortJourneyMilestones(rows);
    expect(sorted.map((r) => r.order)).toEqual([1, 3]);
  });

  it("puts unknown categories last", () => {
    const rows = [
      { category: "CUSTOM", order: 1 },
      { category: "VALIDATION", order: 5 },
    ];
    const sorted = sortJourneyMilestones(rows);
    expect(sorted[0].category).toBe("VALIDATION");
    expect(sorted[1].category).toBe("CUSTOM");
  });
});

describe("MILESTONE_CATEGORY_ORDER", () => {
  it("is non-empty", () => {
    expect(MILESTONE_CATEGORY_ORDER.length).toBeGreaterThan(0);
  });
});
