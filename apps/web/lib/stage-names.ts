/** Venture lifecycle stages (1–13). */
export const STAGE_NAMES: Record<number, string> = {
  1: "Problem Discovery",
  2: "Customer Validation",
  3: "Solution Design",
  4: "MVP Build",
  5: "First Users",
  6: "Product-Market Fit",
  7: "Revenue Model",
  8: "Growth Engine",
  9: "Team Building",
  10: "Fundraising",
  11: "Scale Operations",
  12: "Market Leadership",
  13: "Exit or Sustain",
};

export function getStageName(stage: number): string {
  const n = Math.max(1, Math.min(13, Math.floor(stage)));
  return STAGE_NAMES[n] ?? `Stage ${n}`;
}
