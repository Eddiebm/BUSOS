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
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-amber-500/90 hover:text-amber-400">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-50">Cap table</h1>
        <p className="text-sm text-zinc-400">Ownership, grants, and round dilution</p>
      </div>

      <div className="rounded-xl border border-amber-500/15 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Financing round modeler</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Assumes new money at pre-money valuation; existing shareholders diluted by{" "}
          <code className="text-amber-200/80">pre / (pre + investment)</code>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-zinc-400">Investment ($)</span>
            <input
              type="number"
              min={0}
              value={round.investment}
              onChange={(e) => setRound((r) => ({ ...r, investment: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-zinc-400">Pre-money valuation ($)</span>
            <input
              type="number"
              min={0}
              value={round.preMoney}
              onChange={(e) => setRound((r) => ({ ...r, preMoney: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
        </div>
        {dilution && totals.total > 0 && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-zinc-300">
              New investor ownership:{" "}
              <span className="font-semibold text-amber-200">{dilution.newInvestorPct.toFixed(2)}%</span>
            </p>
            <ul className="space-y-1 border-t border-zinc-800 pt-2">
              {rows.map((s) => {
                const sh = totals.bySh[s.id] ?? 0;
                const before = (sh / totals.total) * 100;
                const after = before * dilution.factor;
                return (
                  <li key={s.id} className="flex justify-between text-zinc-400">
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
        {totals.total === 0 && <p className="mt-3 text-sm text-zinc-600">Add shares below to model dilution.</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
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
                <tr key={s.id} className="border-b border-zinc-800/80 text-zinc-300">
                  <td className="p-3 font-medium text-zinc-100">{s.name}</td>
                  <td className="p-3">{KIND_LABEL[s.type]}</td>
                  <td className="p-3 text-right tabular-nums">{sh.toLocaleString()}</td>
                  <td className="p-3 text-right tabular-nums">{pct.toFixed(2)}%</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeShareholder(s.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-900/50 font-medium text-zinc-200">
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

      <form onSubmit={addShareholder} className="rounded-xl border border-amber-500/15 bg-zinc-900/60 p-4 space-y-3">
        <h2 className="font-semibold text-zinc-100">Add shareholder</h2>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Name"
            value={shForm.name}
            onChange={(e) => setShForm((f) => ({ ...f, name: e.target.value }))}
            className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            required
          />
          <select
            value={shForm.type}
            onChange={(e) => setShForm((f) => ({ ...f, type: e.target.value as ShareholderKind }))}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          >
            <option value="FOUNDER">Founder</option>
            <option value="INVESTOR">Investor</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">Equity grants</h2>
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
              className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
            >
              <span className="w-full text-sm font-medium text-zinc-200 sm:w-auto">{s.name}</span>
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
                className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
              <select
                value={g.equityType}
                onChange={(e) =>
                  setGrantBySh((prev) => ({
                    ...prev,
                    [s.id]: { ...g, equityType: e.target.value as EquityKind },
                  }))
                }
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
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
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => addGrant(s.id)}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700"
              >
                Add grant
              </button>
              <div className="w-full text-xs text-zinc-600 sm:w-auto">
                {(s.grants ?? []).map((gr) => (
                  <span key={gr.id} className="mr-3">
                    {gr.equityType} {gr.shares.toLocaleString()} @ {gr.date.slice(0, 10)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-zinc-600">No shareholders yet.</p>}
      </div>
    </div>
  );
}
