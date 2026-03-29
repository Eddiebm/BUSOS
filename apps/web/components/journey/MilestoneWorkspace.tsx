"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/components/journey/MilestoneCard";
import {
  type ChecklistWorkspaceData,
  emptyChecklistData,
  parseChecklistWorkspaceData,
} from "@/lib/milestone-workspace-checklist";

type Props = {
  milestone: Milestone;
  ventureId: string;
  onUpdate: (m: Milestone) => void;
  disabled?: boolean;
};

function newId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MilestoneWorkspace({ milestone: m, ventureId, onUpdate, disabled }: Props) {
  const type = (m.workspaceType ?? "NONE") as string;
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(
    (data: ChecklistWorkspaceData) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          const res = await fetch(`/api/ventures/${ventureId}/milestones/${m.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceType: "CHECKLIST",
              workspaceData: data,
            }),
          });
          if (res.ok) {
            const updated = await res.json();
            onUpdate(updated);
          }
        } finally {
          setSaving(false);
        }
      }, 450);
    },
    [ventureId, m.id, onUpdate]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function activateChecklist() {
    setSaving(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/milestones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceType: "CHECKLIST",
          workspaceData: emptyChecklistData(),
        }),
      });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setSaving(false);
    }
  }

  if (type === "NONE") {
    return (
      <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-800">
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Your workspace
            </h4>
            <p className="mt-1 text-sm text-slate-700">
              Do the work here — checklists and other tools save to this milestone.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || saving || m.completed || m.skipped}
            onClick={() => void activateChecklist()}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start checklist"}
          </button>
        </div>
      </section>
    );
  }

  if (type === "CHECKLIST") {
    const data = parseChecklistWorkspaceData(m.workspaceData);
    const items =
      data.items.length > 0 ? data.items : [{ id: "draft-0", label: "", done: false }];

    function updateItems(next: ChecklistWorkspaceData["items"]) {
      const payload: ChecklistWorkspaceData = { items: next };
      onUpdate({
        ...m,
        workspaceType: "CHECKLIST",
        workspaceData: payload,
      });
      flushSave(payload);
    }

    return (
      <section className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-800">
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Checklist workspace
          </h4>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.done}
                disabled={disabled || m.completed || m.skipped}
                onChange={() => {
                  const next = items.map((it, i) =>
                    i === idx ? { ...it, done: !it.done } : it
                  );
                  updateItems(next);
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <input
                type="text"
                value={item.label}
                disabled={disabled || m.completed || m.skipped}
                onChange={(e) => {
                  const next = items.map((it, i) =>
                    i === idx ? { ...it, label: e.target.value } : it
                  );
                  updateItems(next);
                }}
                placeholder="Step or sub-task…"
                className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              <button
                type="button"
                disabled={disabled || m.completed || m.skipped || items.length <= 1}
                onClick={() => updateItems(items.filter((_, i) => i !== idx))}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={disabled || m.completed || m.skipped}
          onClick={() => updateItems([...items, { id: newId(), label: "", done: false }])}
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50",
            (disabled || m.completed || m.skipped) && "opacity-50"
          )}
        >
          <Plus className="h-4 w-4" />
          Add row
        </button>
      </section>
    );
  }

  // Other workspace types: placeholder until modules exist
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      Workspace type <strong>{type}</strong> is not interactive in the UI yet. Use checklist for now
      (change type in the database or reset milestone workspace to NONE and add checklist).
    </section>
  );
}
