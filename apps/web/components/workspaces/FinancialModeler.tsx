"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Milestone } from "@/components/journey/MilestoneCard";

const DEBOUNCE_MS = 400;

export type FinancialModelState = {
  revenuePerUser: number;
  monthlyGrowthPct: number;
  cogsPct: number;
  fixedMonthlyCosts: number;
  startingUsers: number;
};

const DEFAULTS: FinancialModelState = {
  revenuePerUser: 0,
  monthlyGrowthPct: 0,
  cogsPct: 0,
  fixedMonthlyCosts: 0,
  startingUsers: 100,
};

function parseState(data: unknown): FinancialModelState {
  if (!data || typeof data !== "object") return { ...DEFAULTS };
  const o = data as Record<string, unknown>;
  return {
    revenuePerUser: Number(o.revenuePerUser) || 0,
    monthlyGrowthPct: Number(o.monthlyGrowthPct) || 0,
    cogsPct: Number(o.cogsPct) || 0,
    fixedMonthlyCosts: Number(o.fixedMonthlyCosts) || 0,
    startingUsers: Number(o.startingUsers) > 0 ? Number(o.startingUsers) : DEFAULTS.startingUsers,
  };
}

type Row = {
  month: number;
  users: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  fixedCosts: number;
  netProfit: number;
};

function buildProjection(s: FinancialModelState): Row[] {
  const rows: Row[] = [];
  let users = s.startingUsers;
  const g = s.monthlyGrowthPct / 100;
  for (let m = 1; m <= 12; m++) {
    if (m > 1) users = users * (1 + g);
    const revenue = users * s.revenuePerUser;
    const cogs = revenue * (s.cogsPct / 100);
    const grossProfit = revenue - cogs;
    const fixedCosts = s.fixedMonthlyCosts;
    const netProfit = grossProfit - fixedCosts;
    rows.push({ month: m, users, revenue, cogs, grossProfit, fixedCosts, netProfit });
  }
  return rows;
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type Props = {
  milestone: Milestone;
  onSave: (data: unknown) => void;
};

export function FinancialModeler({ milestone, onSave }: Props) {
  const [s, setS] = useState<FinancialModelState>(() => parseState(milestone.workspaceData));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(
    (next: FinancialModelState) => {
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

  function setField<K extends keyof FinancialModelState>(key: K, value: number) {
    setS((prev) => {
      const next = { ...prev, [key]: value };
      flush(next);
      return next;
    });
  }

  const rows = useMemo(() => buildProjection(s), [s]);

  const fields: { key: keyof FinancialModelState; label: string }[] = [
    { key: "startingUsers", label: "Starting users (month 1)" },
    { key: "revenuePerUser", label: "Revenue per user / month" },
    { key: "monthlyGrowthPct", label: "User growth % / month" },
    { key: "cogsPct", label: "COGS % of revenue" },
    { key: "fixedMonthlyCosts", label: "Fixed costs / month" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary">
              {label}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={Number.isFinite(s[key]) ? s[key] : 0}
              onChange={(e) => setField(key, parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </label>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-primary/25">
        <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-card/80">
              {["Month", "Users", "Revenue", "COGS", "Gross profit", "Fixed costs", "Net profit"].map(
                (h) => (
                  <th key={h} className="px-2 py-2 text-left font-semibold text-primary">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-b border-border/80">
                <td className="px-2 py-1.5 text-muted-foreground">{r.month}</td>
                <td className="px-2 py-1.5 text-foreground">{fmt(r.users)}</td>
                <td className="px-2 py-1.5 text-foreground">{fmt(r.revenue)}</td>
                <td className="px-2 py-1.5 text-foreground">{fmt(r.cogs)}</td>
                <td className="px-2 py-1.5 text-foreground">{fmt(r.grossProfit)}</td>
                <td className="px-2 py-1.5 text-foreground">{fmt(r.fixedCosts)}</td>
                <td
                  className={`px-2 py-1.5 font-medium ${
                    r.netProfit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {fmt(r.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
