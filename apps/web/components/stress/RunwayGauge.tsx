"use client";

interface RunwayGaugeProps {
  months?: number | null;
}

export function RunwayGauge({ months }: RunwayGaugeProps) {
  const value = months ?? 0;
  const display = value > 0 ? `${value} mo` : "—";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Runway</span>
      <span
        className={
          value < 6 ? "font-semibold text-red-600" : value < 12 ? "text-amber-600" : "text-green-600"
        }
      >
        {display}
      </span>
    </div>
  );
}
