"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { sortJourneyMilestones } from "@/lib/sort-milestones";

type MilestoneRow = {
  id: string;
  title: string;
  category: string;
  order: number;
  completed: boolean;
  skipped: boolean;
  dueDate: string | null;
};

const CAT_BADGE: Record<string, string> = {
  VALIDATION: "bg-primary/12 text-foreground",
  PRODUCT: "bg-info/15 text-foreground",
  LEGAL: "bg-warning/15 text-foreground",
  FINANCIAL: "bg-success/15 text-foreground",
  GROWTH: "bg-secondary/15 text-foreground",
  IP: "bg-destructive/12 text-destructive",
};

export function UpcomingMilestones({ ventureId }: { ventureId: string }) {
  const [items, setItems] = useState<MilestoneRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/ventures/${ventureId}/milestones`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MilestoneRow[]) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        const open = list.filter((m) => !m.completed && !m.skipped);
        const sorted = sortJourneyMilestones(open);
        setItems(sorted.slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ventureId]);

  if (loading) {
    return (
      <div className="rounded-lg bg-card p-4 shadow">
        <h3 className="mb-3 font-medium text-foreground">Upcoming milestones</h3>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow">
        <h3 className="mb-1 font-medium text-foreground">Upcoming milestones</h3>
        <p className="text-sm text-muted-foreground">
          No open milestones — or complete Dream Intake to generate your roadmap.
        </p>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary"
        >
          View journey →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-foreground">Upcoming milestones</h3>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="text-sm font-medium text-primary hover:text-primary"
        >
          Full roadmap →
        </Link>
      </div>
      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className="flex flex-wrap items-start gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                CAT_BADGE[m.category] ?? "bg-muted text-foreground"
              )}
            >
              {m.category}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{m.title}</p>
              {m.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Due {new Date(m.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
