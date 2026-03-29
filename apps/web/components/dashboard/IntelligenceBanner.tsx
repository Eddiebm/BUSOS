"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type IntelligencePayload =
  | {
      type: "CRITICAL_GAP";
      message: string;
      milestone?: { title: string; category: string };
    }
  | { type: "ON_TRACK"; message: string }
  | { type: "NO_DNA"; message: string };

export function IntelligenceBanner({ ventureId }: { ventureId: string }) {
  const [intel, setIntel] = useState<IntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ventures/${ventureId}/intelligence`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: IntelligencePayload | null) => setIntel(data))
      .catch(() => setIntel(null))
      .finally(() => setLoading(false));
  }, [ventureId]);

  if (loading) {
    return (
      <div
        className="mb-6 h-14 animate-pulse rounded-lg bg-slate-100"
        aria-hidden
      />
    );
  }

  if (!intel) return null;

  if (intel.type === "CRITICAL_GAP") {
    return (
      <div
        className={cn(
          "mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className="flex gap-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-red-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Critical gap identified
            </p>
            <p className="mt-1 text-sm text-red-800">{intel.message}</p>
          </div>
        </div>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="shrink-0 text-sm font-medium text-red-800 underline underline-offset-2 hover:text-red-950"
        >
          View your roadmap →
        </Link>
      </div>
    );
  }

  if (intel.type === "ON_TRACK") {
    return (
      <div
        className={cn(
          "mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900"
        )}
      >
        <Check className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
        <p className="text-sm font-medium text-green-900">{intel.message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-900 sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className="flex gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
        <p className="text-sm font-medium text-indigo-900">{intel.message}</p>
      </div>
      <Link
        href={`/ventures/${ventureId}/dream`}
        className="shrink-0 text-sm font-semibold text-indigo-800 underline underline-offset-2 hover:text-indigo-950"
      >
        Start Dream Intake →
      </Link>
    </div>
  );
}
