/** Category order used across journey UI and APIs (highest priority first for “next up” lists). */
export const MILESTONE_CATEGORY_ORDER = [
  "VALIDATION",
  "PRODUCT",
  "LEGAL",
  "FINANCIAL",
  "GROWTH",
  "IP",
] as const;

function categoryRank(category: string): number {
  const i = MILESTONE_CATEGORY_ORDER.findIndex((c) => c === category);
  return i === -1 ? 99 : i;
}

export function sortJourneyMilestones<T extends { category: string; order: number }>(
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => {
    const na = categoryRank(a.category);
    const nb = categoryRank(b.category);
    if (na !== nb) return na - nb;
    return a.order - b.order;
  });
}
