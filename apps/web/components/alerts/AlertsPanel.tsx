"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
}

const URGENT_TYPES = new Set(["CASH_RUNWAY", "COMPETITOR_THREAT"]);

interface AlertsPanelProps {
  ventureId: string;
  maxItems?: number;
}

export function AlertsPanel({ ventureId, maxItems = 20 }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const load = useCallback(() => {
    fetch(`/api/ventures/${ventureId}/alerts?dismissed=false&read=false`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const markViewed = (alertId: string) => {
    fetch(`/api/ventures/${ventureId}/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    }).then(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    });
  };

  const list = alerts.slice(0, maxItems);
  if (list.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="font-semibold text-foreground">Alerts</h3>
      <ul className="mt-3 space-y-3">
        {list.map((a) => {
          const urgent = URGENT_TYPES.has(a.type) || a.severity === "CRITICAL";
          return (
            <li
              key={a.id}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg border p-3 text-sm",
                urgent
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-info/35 bg-info/10 text-foreground"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{a.type}</p>
                <p className="font-medium">{a.title}</p>
                <p className={cn("mt-1", urgent ? "text-destructive" : "text-info")}>{a.message}</p>
                {a.actionUrl && (
                  <Link href={a.actionUrl} className="mt-1 inline-block text-xs underline">
                    View
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => markViewed(a.id)}
                className={cn(
                  "shrink-0 rounded px-2 py-1 text-xs font-medium",
                  urgent
                    ? "text-destructive hover:bg-destructive/15"
                    : "text-info hover:bg-info/15"
                )}
              >
                Dismiss
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
