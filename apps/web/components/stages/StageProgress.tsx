"use client";

import type { StressMode } from "@/hooks/useVenture";
import { getStageName } from "@/lib/stage-names";

interface StageProgressProps {
  currentStage: number;
  mode: StressMode;
}

export function StageProgress({ currentStage, mode }: StageProgressProps) {
  const name = getStageName(currentStage);
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="font-medium text-foreground">Stage progress</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{name}</span>
        <span className="text-muted-foreground"> — Stage {currentStage} of 13</span>
        <span className="block text-xs text-muted-foreground">Mode: {mode}</span>
      </p>
      <div className="mt-2 h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-info"
          style={{ width: `${(currentStage / 13) * 100}%` }}
        />
      </div>
    </div>
  );
}
