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
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-medium text-gray-900">Stage progress</h3>
      <p className="mt-2 text-sm text-gray-600">
        <span className="font-medium text-gray-900">{name}</span>
        <span className="text-gray-500"> — Stage {currentStage} of 13</span>
        <span className="block text-xs text-gray-500">Mode: {mode}</span>
      </p>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${(currentStage / 13) * 100}%` }}
        />
      </div>
    </div>
  );
}
