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
  VALIDATION: "bg-indigo-100 text-indigo-900",
  PRODUCT: "bg-blue-100 text-blue-900",
  LEGAL: "bg-amber-100 text-amber-900",
  FINANCIAL: "bg-green-100 text-green-900",
  GROWTH: "bg-purple-100 text-purple-900",
  IP: "bg-rose-100 text-rose-900",
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
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-3 font-medium text-slate-900">Upcoming milestones</h3>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow">
        <h3 className="mb-1 font-medium text-slate-900">Upcoming milestones</h3>
        <p className="text-sm text-slate-600">
          No open milestones — or complete Dream Intake to generate your roadmap.
        </p>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View journey →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-slate-900">Upcoming milestones</h3>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Full roadmap →
        </Link>
      </div>
      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className="flex flex-wrap items-start gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                CAT_BADGE[m.category] ?? "bg-slate-100 text-slate-800"
              )}
            >
              {m.category}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{m.title}</p>
              {m.dueDate && (
                <p className="text-xs text-slate-500">
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
