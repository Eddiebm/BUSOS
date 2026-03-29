"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { Milestone } from "@/components/journey/MilestoneCard";

const DEBOUNCE_MS = 400;

export type CompetitorRow = {
  name: string;
  pricing: string;
  strengths: string;
  weaknesses: string;
};

function emptyRow(): CompetitorRow {
  return { name: "", pricing: "", strengths: "", weaknesses: "" };
}

function parseRows(data: unknown): CompetitorRow[] {
  if (!data || typeof data !== "object") return [emptyRow(), emptyRow()];
  const raw = (data as { competitors?: unknown }).competitors;
  if (!Array.isArray(raw) || raw.length === 0) return [emptyRow(), emptyRow()];
  return raw.map((r) => {
    if (!r || typeof r !== "object") return emptyRow();
    const o = r as Record<string, unknown>;
    return {
      name: String(o.name ?? ""),
      pricing: String(o.pricing ?? ""),
      strengths: String(o.strengths ?? ""),
      weaknesses: String(o.weaknesses ?? ""),
    };
  });
}

type Props = {
  milestone: Milestone;
  onSave: (data: unknown) => void;
};

export function CompetitorMatrix({ milestone, onSave }: Props) {
  const [rows, setRows] = useState<CompetitorRow[]>(() => parseRows(milestone.workspaceData));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(
    (next: CompetitorRow[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onSave({ competitors: next });
      }, DEBOUNCE_MS);
    },
    [onSave]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function updateRow(i: number, patch: Partial<CompetitorRow>) {
    setRows((prev) => {
      const next = prev.map((r, j) => (j === i ? { ...r, ...patch } : r));
      flush(next);
      return next;
    });
  }

  function addRow() {
    setRows((prev) => {
      const next = [...prev, emptyRow()];
      flush(next);
      return next;
    });
  }

  function removeRow(i: number) {
    setRows((prev) => {
      const next = prev.filter((_, j) => j !== i);
      const safe = next.length > 0 ? next : [emptyRow()];
      flush(safe);
      return safe;
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-primary/25">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-card/80">
              <th className="px-2 py-2 text-left font-semibold text-primary">Competitor</th>
              <th className="px-2 py-2 text-left font-semibold text-primary">Pricing</th>
              <th className="px-2 py-2 text-left font-semibold text-primary">Strengths</th>
              <th className="px-2 py-2 text-left font-semibold text-primary">Weaknesses</th>
              <th className="w-10 px-1" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/80">
                <td className="p-1 align-top">
                  <textarea
                    value={row.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                    rows={2}
                    className="w-full resize-y rounded border border-border bg-card px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Name"
                  />
                </td>
                <td className="p-1 align-top">
                  <textarea
                    value={row.pricing}
                    onChange={(e) => updateRow(i, { pricing: e.target.value })}
                    rows={2}
                    className="w-full resize-y rounded border border-border bg-card px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Pricing"
                  />
                </td>
                <td className="p-1 align-top">
                  <textarea
                    value={row.strengths}
                    onChange={(e) => updateRow(i, { strengths: e.target.value })}
                    rows={2}
                    className="w-full resize-y rounded border border-border bg-card px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Strengths"
                  />
                </td>
                <td className="p-1 align-top">
                  <textarea
                    value={row.weaknesses}
                    onChange={(e) => updateRow(i, { weaknesses: e.target.value })}
                    rows={2}
                    className="w-full resize-y rounded border border-border bg-card px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Weaknesses"
                  />
                </td>
                <td className="align-top p-1">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="rounded px-2 py-1 text-lg leading-none text-muted-foreground hover:bg-muted hover:text-primary"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
      >
        <Plus className="h-4 w-4" />
        Add competitor
      </button>
    </div>
  );
}
