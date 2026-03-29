"use client";

import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/datetime";

type Row = {
  id: string;
  description: string;
  createdAt: string;
  user: { name: string | null; email: string } | null;
};

export function ActivityFeed({ ventureId }: { ventureId: string }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch(`/api/ventures/${ventureId}/activities?limit=12`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, [ventureId]);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/25 bg-card/80 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Team activity</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {rows.map((a) => (
          <li key={a.id} className="flex gap-2 border-b border-border/80 pb-2 last:border-0">
            <span className="shrink-0 text-primary/80">•</span>
            <span>
              <span className="font-medium text-foreground">{a.user?.name ?? a.user?.email ?? "Someone"}</span>{" "}
              {a.description}{" "}
              <time className="text-muted-foreground" dateTime={a.createdAt}>
                {formatRelative(a.createdAt)}
              </time>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
