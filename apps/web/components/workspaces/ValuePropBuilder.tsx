"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Milestone } from "@/components/journey/MilestoneCard";

const DEBOUNCE_MS = 400;

export type ValuePropState = {
  customer: string;
  problem: string;
  category: string;
  benefit: string;
  competitor: string;
};

function parseState(data: unknown): ValuePropState {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return {
    customer: String(d.customer ?? ""),
    problem: String(d.problem ?? ""),
    category: String(d.category ?? ""),
    benefit: String(d.benefit ?? ""),
    competitor: String(d.competitor ?? ""),
  };
}

type Props = {
  milestone: Milestone;
  onSave: (data: unknown) => void;
};

export function ValuePropBuilder({ milestone, onSave }: Props) {
  const [s, setS] = useState<ValuePropState>(() => parseState(milestone.workspaceData));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(
    (next: ValuePropState) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onSave(next), DEBOUNCE_MS);
    },
    [onSave]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function setField<K extends keyof ValuePropState>(key: K, value: string) {
    setS((prev) => {
      const next = { ...prev, [key]: value };
      flush(next);
      return next;
    });
  }

  const ph = (v: string, placeholder: string) =>
    v.trim() ? v : <span className="text-zinc-600">{placeholder}</span>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-1">
        {(
          [
            ["customer", "Customer", "who you serve"],
            ["problem", "Problem", "the pain you solve"],
            ["category", "Category / product type", "what you offer"],
            ["benefit", "Key benefit", "why it matters"],
            ["competitor", "Alternatives / status quo", "what they use today"],
          ] as const
        ).map(([key, label, phText]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200/80">
              {label}
            </span>
            <input
              type="text"
              value={s[key]}
              onChange={(e) => setField(key, e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder={phText}
            />
          </label>
        ))}
      </div>
      <div className="rounded-lg border border-amber-400/40 bg-zinc-900/80 p-4 text-sm leading-relaxed text-zinc-200">
        For {ph(s.customer, "[customer]")}, who {ph(s.problem, "[problem]")}, our{" "}
        {ph(s.category, "[category]")} is the solution that {ph(s.benefit, "[benefit]")}, unlike{" "}
        {ph(s.competitor, "[competitor]")}.
      </div>
    </div>
  );
}
