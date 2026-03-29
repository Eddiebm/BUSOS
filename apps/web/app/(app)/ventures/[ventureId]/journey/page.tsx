"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MilestoneRow {
  id: string;
  category: string;
  title: string;
  description: string;
  reason: string | null;
  order: number;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  skipped: boolean;
  skipReason: string | null;
  aiGenerated: boolean;
}

interface AdaPayload {
  text: string;
  tone?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  VALIDATION: "bg-indigo-100 text-indigo-900 ring-indigo-200",
  PRODUCT: "bg-blue-100 text-blue-900 ring-blue-200",
  LEGAL: "bg-amber-100 text-amber-900 ring-amber-200",
  FINANCIAL: "bg-green-100 text-green-900 ring-green-200",
  GROWTH: "bg-purple-100 text-purple-900 ring-purple-200",
  IP: "bg-red-100 text-red-900 ring-red-200",
};

const CATEGORY_ORDER = ["VALIDATION", "PRODUCT", "LEGAL", "FINANCIAL", "GROWTH", "IP"];

function groupByCategory(rows: MilestoneRow[]): Map<string, MilestoneRow[]> {
  const map = new Map<string, MilestoneRow[]>();
  for (const m of rows) {
    const list = map.get(m.category) ?? [];
    list.push(m);
    map.set(m.category, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.order - b.order);
  }
  return map;
}

function categoryRenderOrder(map: Map<string, MilestoneRow[]>): string[] {
  const keys = new Set(map.keys());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of CATEGORY_ORDER) {
    if (keys.has(c)) {
      out.push(c);
      seen.add(c);
    }
  }
  for (const c of keys) {
    if (!seen.has(c)) out.push(c);
  }
  return out;
}

export default function JourneyRoadmapPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [ventureName, setVentureName] = useState("");
  const [dnaExists, setDnaExists] = useState<boolean | null>(null);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [ada, setAda] = useState<AdaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [skipDraft, setSkipDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dnaRes, mRes, aRes] = await Promise.all([
        fetch(`/api/ventures/${ventureId}`),
        fetch(`/api/ventures/${ventureId}/dna`),
        fetch(`/api/ventures/${ventureId}/milestones`),
        fetch(`/api/ventures/${ventureId}/ada`),
      ]);
      if (vRes.ok) {
        const v = await vRes.json();
        setVentureName(v.name ?? "Venture");
      }
      if (dnaRes.ok) {
        const d = (await dnaRes.json()) as { id?: string } | null;
        setDnaExists(Boolean(d && d.id));
      } else {
        setDnaExists(false);
      }
      if (mRes.ok) {
        const m = await mRes.json();
        setMilestones(Array.isArray(m) ? m : []);
      }
      if (aRes.ok) setAda(await aRes.json());
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = milestones.length;
  const done = milestones.filter((m) => m.completed).length;

  const toggleComplete = async (m: MilestoneRow) => {
    const next = !m.completed;
    const res = await fetch(`/api/ventures/${ventureId}/milestones/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...updated } : x)));
    }
  };

  const patchMilestone = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/ventures/${ventureId}/milestones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setMilestones((prev) => prev.map((x) => (x.id === id ? { ...x, ...updated } : x)));
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-600">Loading your journey…</div>
    );
  }

  if (dnaExists === false) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Before we map your journey, tell Ada your story.</h1>
        <Link
          href={`/ventures/${ventureId}/dream`}
          className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Start Dream Intake
        </Link>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-slate-500 hover:text-slate-800">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const grouped = groupByCategory(milestones);
  const categories = categoryRenderOrder(grouped);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Journey</h1>
        <p className="mt-1 text-lg text-slate-600">{ventureName}</p>
        <p className="text-slate-600">Every step from dream to launch. Nothing forgotten.</p>
      </div>

      {ada && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-800">Ada</p>
          <p className="mt-2 text-indigo-950">{ada.text}</p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
          <span>
            {done} of {total} milestones complete
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {categories.map((cat) => {
        const list = grouped.get(cat) ?? [];
        if (list.length === 0) return null;
        const badgeClass = CATEGORY_STYLES[cat] ?? "bg-slate-100 text-slate-800 ring-slate-200";
        return (
          <section key={cat} className="space-y-3">
            <h2
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1",
                badgeClass
              )}
            >
              {cat}
            </h2>
            <ul className="space-y-3">
              {list.map((m) => {
                const overdue =
                  m.dueDate && !m.completed && new Date(m.dueDate) < new Date(new Date().toDateString());
                const open = expanded === m.id;
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "rounded-xl border bg-white p-4 shadow-sm",
                      m.completed ? "border-slate-200 opacity-90" : "border-slate-200"
                    )}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <input
                        type="checkbox"
                        checked={m.completed}
                        onChange={() => toggleComplete(m)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Mark complete: ${m.title}`}
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : m.id)}
                          className="text-left"
                        >
                          <span
                            className={cn(
                              "font-semibold text-slate-900",
                              m.completed && "text-slate-500 line-through"
                            )}
                          >
                            {m.title}
                          </span>
                        </button>
                        {m.dueDate && (
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              overdue ? "font-medium text-red-600" : "text-slate-500"
                            )}
                          >
                            Due {new Date(m.dueDate).toLocaleDateString()}
                            {overdue ? " — overdue" : ""}
                          </p>
                        )}
                        {m.skipped && m.skipReason && (
                          <p className="mt-1 text-xs text-amber-700">Skipped: {m.skipReason}</p>
                        )}
                        {open && (
                          <p className="mt-3 text-sm text-slate-600">{m.description}</p>
                        )}
                        {m.reason && (
                          <p className="mt-2 text-xs italic text-slate-500">
                            Why this exists: {m.reason}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            Due
                            <input
                              type="date"
                              value={m.dueDate ? m.dueDate.slice(0, 10) : ""}
                              onChange={(e) =>
                                patchMilestone(m.id, {
                                  dueDate: e.target.value ? e.target.value : null,
                                })
                              }
                              className="rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                          </label>
                          {!m.skipped ? (
                            <button
                              type="button"
                              className="text-xs font-medium text-slate-600 underline"
                              onClick={() => {
                                const reason = skipDraft[m.id] ?? "";
                                patchMilestone(m.id, { skipped: true, skipReason: reason || "Skipped" });
                              }}
                            >
                              Mark skipped
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="text-xs font-medium text-indigo-600"
                              onClick={() => patchMilestone(m.id, { skipped: false, skipReason: null })}
                            >
                              Un-skip
                            </button>
                          )}
                        </div>
                        {!m.skipped && (
                          <input
                            type="text"
                            placeholder="Skip reason (optional)"
                            value={skipDraft[m.id] ?? ""}
                            onChange={(e) =>
                              setSkipDraft((s) => ({ ...s, [m.id]: e.target.value }))
                            }
                            className="mt-2 w-full max-w-md rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        )}
                        {!m.aiGenerated && (
                          <button
                            type="button"
                            className="mt-2 text-xs text-red-600 hover:underline"
                            onClick={async () => {
                              if (!confirm("Delete this custom milestone?")) return;
                              const res = await fetch(
                                `/api/ventures/${ventureId}/milestones/${m.id}`,
                                { method: "DELETE" }
                              );
                              if (res.ok) setMilestones((prev) => prev.filter((x) => x.id !== m.id));
                            }}
                          >
                            Delete milestone
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
