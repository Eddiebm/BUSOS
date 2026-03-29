/**
 * Stress score 0–100 from runway, overdue tasks, and inactivity.
 * Mode: DISCOVERY (< 40), EXECUTION (40–70), SURVIVAL (> 70).
 */
export function calculateStress(
  runwayMonths: number | null | undefined,
  overdueTaskCount: number,
  daysSinceLastActivity: number
): { level: number; mode: "DISCOVERY" | "EXECUTION" | "SURVIVAL" } {
  let stress = 0;
  // Runway: 18 months = 0 stress, 0 months = 40
  if (runwayMonths != null && runwayMonths >= 0) {
    stress += (1 - Math.min(1, runwayMonths / 18)) * 40;
  } else {
    stress += 20; // unknown runway adds baseline
  }
  stress += overdueTaskCount * 5;
  stress += Math.min(30, daysSinceLastActivity * 2);
  const level = Math.min(100, Math.max(0, Math.round(stress)));

  const mode =
    level > 70 ? "SURVIVAL" : level > 40 ? "EXECUTION" : "DISCOVERY";

  return { level, mode };
}
