"use client";

interface RunwayGaugeProps {
  months?: number | null;
}

export function RunwayGauge({ months }: RunwayGaugeProps) {
  const value = months ?? 0;
  const display = value > 0 ? `${value} mo` : "—";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-zinc-500">Runway</span>
      <span
        className={
          value < 6 ? "font-semibold text-red-400" : value < 12 ? "text-amber-400" : "text-emerald-400"
        }
      >
        {display}
      </span>
    </div>
  );
}
