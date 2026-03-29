"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function VentureSettingsPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cashRunwayMonths, setCashRunwayMonths] = useState<number | "">("");
  const [monthlyBurn, setMonthlyBurn] = useState<number | "">("");
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ventureId) return;
    fetch(`/api/ventures/${ventureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (v) {
          setName(v.name ?? "");
          setDescription(v.description ?? "");
          setCashRunwayMonths(v.cashRunwayMonths ?? "");
          setMonthlyBurn(v.monthlyBurn ?? "");
          setMonthlyRevenue(v.monthlyRevenue ?? "");
        }
      });
  }, [ventureId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventureId || saving) return;
    setSaving(true);
    fetch(`/api/ventures/${ventureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        cashRunwayMonths: cashRunwayMonths === "" ? null : Number(cashRunwayMonths),
        monthlyBurn: monthlyBurn === "" ? null : Number(monthlyBurn),
        monthlyRevenue: monthlyRevenue === "" ? null : Number(monthlyRevenue),
      }),
    })
      .then((r) => {
        if (r.ok) toast.success("Settings saved");
        else toast.error("Could not save settings");
      })
      .catch(() => toast.error("Could not save settings"))
      .finally(() => setSaving(false));
  };

  return (
    <div className="max-w-lg space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard?ventureId=${ventureId}`}
          className="text-sm text-amber-500/90 hover:text-amber-400"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-zinc-50">Venture settings</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/ventures/${ventureId}/settings/team`}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-amber-500/40"
        >
          Team & access
        </Link>
        <Link
          href={`/ventures/${ventureId}/settings/integrations`}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-amber-500/40"
        >
          Integrations
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-amber-500/15 bg-zinc-900/60 p-6"
      >
        <div>
          <label htmlFor="vs-name" className="block text-sm font-medium text-zinc-400">
            Venture name
          </label>
          <input
            id="vs-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="vs-desc" className="block text-sm font-medium text-zinc-400">
            Description
          </label>
          <textarea
            id="vs-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="vs-burn" className="block text-sm font-medium text-zinc-400">
            Monthly burn (USD)
          </label>
          <input
            id="vs-burn"
            type="number"
            min={0}
            step={100}
            value={monthlyBurn}
            onChange={(e) => setMonthlyBurn(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="vs-rev" className="block text-sm font-medium text-zinc-400">
            Monthly revenue (USD)
          </label>
          <input
            id="vs-rev"
            type="number"
            min={0}
            step={100}
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(e.target.value === "" ? "" : Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="vs-runway" className="block text-sm font-medium text-zinc-400">
            Cash runway (months)
          </label>
          <input
            id="vs-runway"
            type="number"
            min={0}
            step={0.5}
            value={cashRunwayMonths}
            onChange={(e) =>
              setCashRunwayMonths(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="e.g. 12"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
