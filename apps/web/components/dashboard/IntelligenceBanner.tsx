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
        className="mb-6 h-14 animate-pulse rounded-lg bg-muted"
        aria-hidden
      />
    );
  }

  if (!intel) return null;

  if (intel.type === "CRITICAL_GAP") {
    return (
      <div
        className={cn(
          "mb-6 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className="flex gap-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-destructive"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Critical gap identified
            </p>
            <p className="mt-1 text-sm text-destructive">{intel.message}</p>
          </div>
        </div>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="shrink-0 text-sm font-medium text-destructive underline underline-offset-2 hover:text-destructive"
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
          "mb-6 flex items-start gap-3 rounded-lg border border-success/35 bg-success/10 p-4 text-foreground"
        )}
      >
        <Check className="h-5 w-5 shrink-0 text-success" aria-hidden />
        <p className="text-sm font-medium text-foreground">{intel.message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-lg border border-primary/35 bg-primary/8 p-4 text-foreground sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className="flex gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">{intel.message}</p>
      </div>
      <Link
        href={`/ventures/${ventureId}/dream`}
        className="shrink-0 text-sm font-semibold text-primary underline underline-offset-2 hover:text-foreground"
      >
        Start Dream Intake →
      </Link>
    </div>
  );
}
