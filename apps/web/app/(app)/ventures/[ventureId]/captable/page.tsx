"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { EquityKind, ShareholderKind } from "@prisma/client";

type Grant = {
  id: string;
  date: string;
  shares: number;
  equityType: EquityKind;
};

type Shareholder = {
  id: string;
  name: string;
  type: ShareholderKind;
  grants: Grant[];
};

const KIND_LABEL: Record<ShareholderKind, string> = {
  FOUNDER: "Founder",
  INVESTOR: "Investor",
  EMPLOYEE: "Employee",
};

export default function CapTablePage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [rows, setRows] = useState<Shareholder[]>([]);
  const [shForm, setShForm] = useState({ name: "", type: "FOUNDER" as ShareholderKind });
  const [grantBySh, setGrantBySh] = useState<Record<string, { shares: string; equityType: EquityKind; date: string }>>(
    {}
  );
  const [round, setRound] = useState({ investment: "", preMoney: "" });

  const load = useCallback(() => {
    fetch(`/api/ventures/${ventureId}/shareholders`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setRows(Array.isArray(data) ? (data as Shareholder[]) : []));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    let total = 0;
    const bySh: Record<string, number> = {};
    for (const s of rows) {
      const sum = s.grants.reduce((a, g) => a + g.shares, 0);
      bySh[s.id] = sum;
      total += sum;
    }
    return { total, bySh };
  }, [rows]);

  const dilution = useMemo(() => {
    const inv = Number(round.investment);
    const pre = Number(round.preMoney);
    if (!Number.isFinite(inv) || !Number.isFinite(pre) || inv <= 0 || pre <= 0) return null;
    const post = pre + inv;
    const newInvestorPct = (inv / post) * 100;
    const factor = pre / post;
    return { inv, pre, post, newInvestorPct, factor };
  }, [round.investment, round.preMoney]);

  const addShareholder = (e: React.FormEvent) => {
    e.preventDefault();
    const name = shForm.name.trim();
    if (!name) return;
    fetch(`/api/ventures/${ventureId}/shareholders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: shForm.type }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Shareholder added");
          setShForm({ name: "", type: "FOUNDER" });
          load();
        } else toast.error("Could not add");
      })
      .catch(() => toast.error("Could not add"));
  };

  const addGrant = (shareholderId: string) => {
    const g = grantBySh[shareholderId] ?? {
      shares: "",
      equityType: "COMMON" as EquityKind,
      date: new Date().toISOString().slice(0, 10),
    };
    const shares = Number(g.shares);
    if (!Number.isFinite(shares) || shares <= 0) {
      toast.error("Enter shares");
      return;
    }
    fetch(`/api/ventures/${ventureId}/shareholders/${shareholderId}/grants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shares,
        equityType: g.equityType,
        date: g.date,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Grant recorded");
          setGrantBySh((prev) => ({
            ...prev,
            [shareholderId]: { ...g, shares: "" },
          }));
          load();
        } else toast.error("Could not add grant");
      })
      .catch(() => toast.error("Could not add grant"));
  };

  const removeShareholder = (id: string) => {
    if (!confirm("Remove shareholder and all grants?")) return;
    fetch(`/api/ventures/${ventureId}/shareholders/${id}`, { method: "DELETE" }).then((r) => {
      if (r.ok) {
        toast.success("Removed");
        load();
      } else toast.error("Could not remove");
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-primary/90 hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Cap table</h1>
        <p className="text-sm text-muted-foreground">Ownership, grants, and round dilution</p>
      </div>

      <div className="rounded-xl border border-primary/15 bg-card/60 p-6">
        <h2 className="text-lg font-semibold text-foreground">Financing round modeler</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assumes new money at pre-money valuation; existing shareholders diluted by{" "}
          <code className="text-primary">pre / (pre + investment)</code>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground">Investment ($)</span>
            <input
              type="number"
              min={0}
              value={round.investment}
              onChange={(e) => setRound((r) => ({ ...r, investment: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Pre-money valuation ($)</span>
            <input
              type="number"
              min={0}
              value={round.preMoney}
              onChange={(e) => setRound((r) => ({ ...r, preMoney: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        {dilution && totals.total > 0 && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-muted-foreground">
              New investor ownership:{" "}
              <span className="font-semibold text-primary">{dilution.newInvestorPct.toFixed(2)}%</span>
            </p>
            <ul className="space-y-1 border-t border-border pt-2">
              {rows.map((s) => {
                const sh = totals.bySh[s.id] ?? 0;
                const before = (sh / totals.total) * 100;
                const after = before * dilution.factor;
                return (
                  <li key={s.id} className="flex justify-between text-muted-foreground">
                    <span>{s.name}</span>
                    <span>
                      {before.toFixed(2)}% → {after.toFixed(2)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {totals.total === 0 && <p className="mt-3 text-sm text-muted-foreground">Add shares below to model dilution.</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-card/80 text-muted-foreground">
              <th className="p-3">Shareholder</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Shares</th>
              <th className="p-3 text-right">Ownership</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const sh = totals.bySh[s.id] ?? 0;
              const pct = totals.total > 0 ? (sh / totals.total) * 100 : 0;
              return (
                <tr key={s.id} className="border-b border-border/80 text-muted-foreground">
                  <td className="p-3 font-medium text-foreground">{s.name}</td>
                  <td className="p-3">{KIND_LABEL[s.type]}</td>
                  <td className="p-3 text-right tabular-nums">{sh.toLocaleString()}</td>
                  <td className="p-3 text-right tabular-nums">{pct.toFixed(2)}%</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeShareholder(s.id)}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-card/50 font-medium text-foreground">
              <td className="p-3" colSpan={2}>
                Total
              </td>
              <td className="p-3 text-right tabular-nums">{totals.total.toLocaleString()}</td>
              <td className="p-3 text-right">100%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <form onSubmit={addShareholder} className="rounded-xl border border-primary/15 bg-card/60 p-4 space-y-3">
        <h2 className="font-semibold text-foreground">Add shareholder</h2>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Name"
            value={shForm.name}
            onChange={(e) => setShForm((f) => ({ ...f, name: e.target.value }))}
            className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <select
            value={shForm.type}
            onChange={(e) => setShForm((f) => ({ ...f, type: e.target.value as ShareholderKind }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="FOUNDER">Founder</option>
            <option value="INVESTOR">Investor</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Equity grants</h2>
        {rows.map((s) => {
          const g =
            grantBySh[s.id] ??
            ({
              shares: "",
              equityType: "COMMON" as EquityKind,
              date: new Date().toISOString().slice(0, 10),
            } as const);
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background/50 p-4"
            >
              <span className="w-full text-sm font-medium text-foreground sm:w-auto">{s.name}</span>
              <input
                type="number"
                min={0}
                placeholder="Shares"
                value={g.shares}
                onChange={(e) =>
                  setGrantBySh((prev) => ({
                    ...prev,
                    [s.id]: { ...g, shares: e.target.value },
                  }))
                }
                className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <select
                value={g.equityType}
                onChange={(e) =>
                  setGrantBySh((prev) => ({
                    ...prev,
                    [s.id]: { ...g, equityType: e.target.value as EquityKind },
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="COMMON">Common</option>
                <option value="PREFERRED">Preferred</option>
                <option value="OPTION">Option</option>
              </select>
              <input
                type="date"
                value={g.date}
                onChange={(e) =>
                  setGrantBySh((prev) => ({
                    ...prev,
                    [s.id]: { ...g, date: e.target.value },
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => addGrant(s.id)}
                className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Add grant
              </button>
              <div className="w-full text-xs text-muted-foreground sm:w-auto">
                {(s.grants ?? []).map((gr) => (
                  <span key={gr.id} className="mr-3">
                    {gr.equityType} {gr.shares.toLocaleString()} @ {gr.date.slice(0, 10)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No shareholders yet.</p>}
      </div>
    </div>
  );
}
