"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sparkles, RefreshCw, LayoutList, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { MilestoneCard, type Milestone } from "@/components/journey/MilestoneCard";

interface AdaPayload {
  text: string;
  tone?: string;
}

const CATEGORY_ORDER = ["VALIDATION", "LEGAL", "FINANCIAL", "PRODUCT", "GROWTH", "IP", "OPERATIONS"];

const CATEGORY_STYLES: Record<string, string> = {
  VALIDATION: "bg-info/15 text-foreground ring-info/35",
  LEGAL: "bg-secondary/15 text-foreground ring-secondary/40",
  FINANCIAL: "bg-success/15 text-foreground ring-success/35",
  PRODUCT: "bg-warning/15 text-foreground ring-warning/30",
  GROWTH: "bg-accent/15 text-foreground ring-accent/40",
  OPERATIONS: "bg-muted text-foreground ring-border",
  IP: "bg-warning/15 text-warning ring-warning/35",
};

type ViewMode = "ordered" | "grouped";
type FilterMode = "all" | "active" | "deferred" | "skipped" | "done";

function groupByCategory(rows: Milestone[]): Map<string, Milestone[]> {
  const map = new Map<string, Milestone[]>();
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

function categoryRenderOrder(map: Map<string, Milestone[]>): string[] {
  const keys = new Set(map.keys());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of CATEGORY_ORDER) {
    if (keys.has(c)) { out.push(c); seen.add(c); }
  }
  for (const c of keys) { if (!seen.has(c)) out.push(c); }
  return out;
}

export default function JourneyRoadmapPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [ventureName, setVentureName] = useState("");
  const [dnaExists, setDnaExists] = useState<boolean | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [ada, setAda] = useState<AdaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("ordered");
  const [filter, setFilter] = useState<FilterMode>("active");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dnaRes, mRes, aRes] = await Promise.all([
        fetch(`/api/ventures/${ventureId}`),
        fetch(`/api/ventures/${ventureId}/dna`),
        fetch(`/api/ventures/${ventureId}/milestones`),
        fetch(`/api/ventures/${ventureId}/ada`),
      ]);
      if (vRes.ok) { const v = await vRes.json(); setVentureName(v.name ?? "Venture"); }
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

  useEffect(() => { load(); }, [load]);

  // Auto-generate milestones if none exist and DNA is present
  useEffect(() => {
    if (!loading && dnaExists && milestones.length === 0 && !generating) {
      generateMilestones(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, dnaExists, milestones.length]);

  async function generateMilestones(regenerate: boolean) {
    setGenerating(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/milestones/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.milestones) setMilestones(data.milestones);
        else await load(); // refresh if milestones already existed
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleMilestoneUpdate(updated: Milestone) {
    setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  const total = milestones.length;
  const done = milestones.filter((m) => m.completed).length;
  const skipped = milestones.filter((m) => m.skipped).length;
  const deferred = milestones.filter((m) => m.deferred && !m.skipped).length;

  function applyFilter(list: Milestone[]): Milestone[] {
    switch (filter) {
      case "active": return list.filter((m) => !m.completed && !m.skipped && !m.deferred);
      case "done": return list.filter((m) => m.completed);
      case "skipped": return list.filter((m) => m.skipped);
      case "deferred": return list.filter((m) => m.deferred && !m.skipped);
      default: return list;
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading your journey…</div>;
  }

  if (dnaExists === false) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Before we map your journey, tell Ada your story.</h1>
        <p className="text-muted-foreground">Ada needs to understand your venture to generate a personalized action plan — not a generic checklist.</p>
        <Link
          href={`/ventures/${ventureId}/dream`}
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Start Dream Intake →
        </Link>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-muted-foreground hover:text-foreground">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (generating && milestones.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Ada is building your roadmap…</h2>
        <p className="mt-2 text-muted-foreground">Personalizing 23 milestones based on your venture DNA. This takes about 15 seconds.</p>
      </div>
    );
  }

  const filteredMilestones = applyFilter(milestones).sort((a, b) => a.order - b.order);
  const grouped = groupByCategory(filteredMilestones);
  const categories = categoryRenderOrder(grouped);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Journey</h1>
          <p className="mt-1 text-lg text-muted-foreground">{ventureName}</p>
          <p className="text-sm text-muted-foreground">Every step from dream to launch — personalized by Ada.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Regenerate your roadmap? This will replace all AI-generated milestones with a fresh plan based on your current venture DNA.")) {
              generateMilestones(true);
            }
          }}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-background disabled:opacity-50 transition"
        >
          <RefreshCw className={cn("h-4 w-4", generating && "animate-spin")} />
          {generating ? "Regenerating…" : "Regenerate roadmap"}
        </button>
      </div>

      {/* Ada message */}
      {ada && (
        <div className="rounded-xl border border-primary/35 bg-primary/8 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">Ada</p>
          <p className="text-sm text-foreground leading-relaxed">{ada.text}</p>
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{done} of {total} milestones complete</span>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {skipped > 0 && <span>{skipped} skipped</span>}
            {deferred > 0 && <span>{deferred} deferred</span>}
            <span>{total - done - skipped} remaining</span>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Toolbar: filter + view mode */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {(["active", "all", "done", "deferred", "skipped"] as FilterMode[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "active" ? "Active" : f === "all" ? "All" : f === "done" ? "Completed" : f === "deferred" ? "Deferred" : "Skipped"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setViewMode("ordered")}
            className={cn("rounded p-1.5 transition", viewMode === "ordered" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            title="Ordered view"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grouped")}
            className={cn("rounded p-1.5 transition", viewMode === "grouped" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            title="Grouped by category"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredMilestones.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          <p className="font-medium">No milestones in this view.</p>
          <button type="button" onClick={() => setFilter("all")} className="mt-2 text-sm text-primary hover:underline">
            Show all milestones
          </button>
        </div>
      )}

      {/* Ordered view — all in one list sorted by order */}
      {viewMode === "ordered" && filteredMilestones.length > 0 && (
        <div className="space-y-3">
          {filteredMilestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              ventureId={ventureId}
              onUpdate={handleMilestoneUpdate}
            />
          ))}
        </div>
      )}

      {/* Grouped view — by category */}
      {viewMode === "grouped" && filteredMilestones.length > 0 && (
        <div className="space-y-8">
          {categories.map((cat) => {
            const list = grouped.get(cat) ?? [];
            if (list.length === 0) return null;
            const badgeClass = CATEGORY_STYLES[cat] ?? "bg-muted text-foreground ring-border";
            return (
              <section key={cat} className="space-y-3">
                <h2 className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1", badgeClass)}>
                  {cat}
                </h2>
                <div className="space-y-3">
                  {list.map((m) => (
                    <MilestoneCard
                      key={m.id}
                      milestone={m}
                      ventureId={ventureId}
                      onUpdate={handleMilestoneUpdate}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
