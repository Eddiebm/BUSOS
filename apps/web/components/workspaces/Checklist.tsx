"use client";

import { useMemo, useState } from "react";
import type { Milestone } from "@/components/journey/MilestoneCard";

export type ChecklistItem = { label: string; checked: boolean };

function parseItems(data: unknown, howToDoIt: string | null | undefined): ChecklistItem[] {
  if (data && typeof data === "object") {
    const raw = (data as { items?: unknown }).items;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((it) => {
        if (it && typeof it === "object") {
          const o = it as Record<string, unknown>;
          return {
            label: String(o.label ?? ""),
            checked: Boolean(o.checked),
          };
        }
        return { label: "", checked: false };
      });
    }
  }
  if (!howToDoIt?.trim()) return [];
  return howToDoIt
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label, checked: false }));
}

type Props = {
  milestone: Milestone;
  onSave: (data: unknown) => void;
};

export function Checklist({ milestone, onSave }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    parseItems(milestone.workspaceData, milestone.howToDoIt)
  );

  const done = useMemo(() => items.filter((i) => i.checked && i.label.trim()).length, [items]);
  const total = useMemo(() => items.filter((i) => i.label.trim()).length, [items]);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function push(next: ChecklistItem[]) {
    setItems(next);
    onSave({ items: next });
  }

  function toggle(i: number) {
    push(items.map((it, j) => (j === i ? { ...it, checked: !it.checked } : it)));
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {done} of {total} complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/70 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3 rounded-lg border border-border/80 bg-card/40 p-2">
            <input
              type="checkbox"
              checked={it.checked}
              onChange={() => toggle(i)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span className="text-sm leading-relaxed text-foreground">{it.label || "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
