"use client";

import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Milestone } from "@/components/journey/MilestoneCard";
import { CompetitorMatrix } from "@/components/workspaces/CompetitorMatrix";
import { ValuePropBuilder } from "@/components/workspaces/ValuePropBuilder";
import { MvpFeatureList } from "@/components/workspaces/MvpFeatureList";
import { FinancialModeler } from "@/components/workspaces/FinancialModeler";
import { Checklist } from "@/components/workspaces/Checklist";

type Props = {
  milestone: Milestone;
  ventureId: string;
  onUpdate?: (m: Milestone) => void;
  disabled?: boolean;
};

export function MilestoneWorkspace({ milestone: m, ventureId, onUpdate, disabled }: Props) {
  const type = (m.workspaceType ?? "NONE") as string;
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (newData: unknown) => {
      if (disabled || m.completed || m.skipped) return;
      setSaving(true);
      try {
        const res = await fetch(
          `/api/ventures/${ventureId}/milestones/${m.id}/workspace`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: newData }),
          }
        );
        if (res.ok) {
          toast.success("Saved", { duration: 2000 });
          onUpdate?.({ ...m, workspaceData: newData });
        } else {
          toast.error("Could not save workspace");
        }
      } finally {
        setSaving(false);
      }
    },
    [ventureId, m, onUpdate, disabled]
  );

  if (type === "NONE") return null;

  const shell = (children: ReactNode) => (
    <div className="rounded-xl border border-amber-500/25 bg-zinc-950/80 p-4 shadow-inner">
      <div className="mb-3 flex min-h-[1.25rem] justify-end">
        {saving ? <span className="text-xs text-zinc-500">Saving…</span> : null}
      </div>
      <div
        className={
          disabled || m.completed || m.skipped ? "pointer-events-none opacity-50" : undefined
        }
      >
        {children}
      </div>
    </div>
  );

  switch (type) {
    case "COMPETITOR_MATRIX":
      return shell(<CompetitorMatrix milestone={m} onSave={save} />);
    case "VALUE_PROP_BUILDER":
      return shell(<ValuePropBuilder milestone={m} onSave={save} />);
    case "MVP_FEATURE_LIST":
      return shell(<MvpFeatureList milestone={m} onSave={save} />);
    case "FINANCIAL_MODELER":
      return shell(<FinancialModeler milestone={m} onSave={save} />);
    case "CHECKLIST":
      return shell(<Checklist milestone={m} onSave={save} />);
    default:
      return null;
  }
}
