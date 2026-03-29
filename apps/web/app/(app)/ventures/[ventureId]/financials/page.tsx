"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUserDateTime } from "@/lib/datetime";
import { toast } from "sonner";
import type { CashFlowType, TransactionCategory } from "@prisma/client";

type Summary = {
  cashBalance: number;
  monthlyIncome: number;
  monthlyBurnRate: number;
  runwayMonths: number | null;
  ventureRunwayStored: number | null;
};

type TxRow = {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: TransactionCategory;
  type: CashFlowType;
};

const CATEGORIES: TransactionCategory[] = ["REVENUE", "PAYROLL", "MARKETING", "SOFTWARE", "OTHER"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinancialsPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [viewerTz, setViewerTz] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [sort, setSort] = useState<"date" | "amount">("date");
  const [filterCat, setFilterCat] = useState<TransactionCategory | "">("");
  const [filterType, setFilterType] = useState<CashFlowType | "">("");

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    description: "",
    category: "SOFTWARE" as TransactionCategory,
    type: "EXPENSE" as CashFlowType,
  });

  const load = useCallback(() => {
    fetch(`/api/user/profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setViewerTz(p?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"))
      .catch(() => setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone));

    fetch(`/api/ventures/${ventureId}/financials/summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSummary);
    fetch(`/api/ventures/${ventureId}/transactions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setTxs(Array.isArray(rows) ? rows : []));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const chart = useMemo(() => {
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const k = monthKey(new Date(t.date));
      const cur = byMonth.get(k) ?? { income: 0, expense: 0 };
      if (t.type === "INCOME") cur.income += t.amount;
      else cur.expense += t.amount;
      byMonth.set(k, cur);
    }
    const keys = [...byMonth.keys()].sort();
    const last = keys.slice(-12);
    const max = Math.max(
      1,
      ...last.map((k) => {
        const v = byMonth.get(k)!;
        return Math.max(v.income, v.expense);
      })
    );
    return { last, byMonth, max };
  }, [txs]);

  const filtered = useMemo(() => {
    let rows = [...txs];
    if (filterCat) rows = rows.filter((t) => t.category === filterCat);
    if (filterType) rows = rows.filter((t) => t.type === filterType);
    rows.sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return rows;
  }, [txs, filterCat, filterType, sort]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !form.description.trim()) {
      toast.error("Enter amount and description");
      return;
    }
    fetch(`/api/ventures/${ventureId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        amount,
        description: form.description.trim(),
        category: form.category,
        type: form.type,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Transaction added");
          setForm((f) => ({ ...f, amount: "", description: "" }));
          load();
        } else toast.error("Could not add transaction");
      })
      .catch(() => toast.error("Could not add transaction"));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard?ventureId=${ventureId}`}
            className="text-sm text-primary/90 hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Financial hub</h1>
          <p className="text-sm text-muted-foreground">Cash flow, burn, and runway — timezone: {viewerTz ?? "…"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Cash balance"
          value={
            summary != null
              ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
                  summary.cashBalance
                )
              : "—"
          }
        />
        <MetricCard
          label="Monthly burn rate"
          value={
            summary != null
              ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
                  summary.monthlyBurnRate
                )
              : "—"
          }
        />
        <MetricCard
          label="Runway"
          value={
            summary?.runwayMonths != null && summary.runwayMonths > 0
              ? `${summary.runwayMonths.toFixed(1)} mo`
              : summary?.ventureRunwayStored != null
                ? `${summary.ventureRunwayStored} mo (stored)`
                : "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-primary/15 bg-card/60 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
            Income vs expense (by month)
          </h2>
          <div className="mt-4 flex h-48 items-end gap-1 border-b border-border pb-2">
            {chart.last.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add transactions to see the chart.</p>
            ) : (
              chart.last.map((k) => {
                const v = chart.byMonth.get(k)!;
                const hi = (v.income / chart.max) * 100;
                const he = (v.expense / chart.max) * 100;
                return (
                  <div key={k} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div className="flex h-40 w-full items-end justify-center gap-0.5">
                      <div
                        className="w-1/2 rounded-t bg-success/100/80"
                        style={{ height: `${hi}%` }}
                        title={`Income ${v.income}`}
                      />
                      <div
                        className="w-1/2 rounded-t bg-destructive/80/80"
                        style={{ height: `${he}%` }}
                        title={`Expense ${v.expense}`}
                      />
                    </div>
                    <span className="truncate text-[10px] text-muted-foreground">{k.slice(2)}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-success/100" /> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-destructive/80" /> Expense
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <PlaceholderCard title="Plaid" subtitle="Bank feeds & reconciliation" />
          <PlaceholderCard title="Stripe" subtitle="Revenue & payouts sync" />
        </div>
      </div>

      <div className="rounded-xl border border-primary/15 bg-card/60 p-6">
        <h2 className="text-lg font-semibold text-foreground">Add transaction</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="text-muted-foreground">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Amount (USD)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Category</span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CashFlowType }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-primary/15 bg-card/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "date" | "amount")}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="date">Sort: date</option>
              <option value="amount">Sort: amount</option>
            </select>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value as TransactionCategory | "")}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CashFlowType | "")}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/80 text-muted-foreground">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {viewerTz ? formatUserDateTime(t.date, viewerTz) : new Date(t.date).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{t.description}</td>
                  <td className="py-2 pr-4">{t.category}</td>
                  <td className="py-2 pr-4">{t.type}</td>
                  <td className="py-2 text-right tabular-nums">
                    {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No transactions match.</p>}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-card to-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}

function PlaceholderCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-primary">Coming soon</span>
      </div>
    </div>
  );
}
