"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Map, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortJourneyMilestones } from "@/lib/sort-milestones";
import type { Milestone } from "@/components/journey/MilestoneCard";

function statusLabel(m: Milestone): string {
  if (m.completed) return "Done";
  if (m.skipped) return "Skipped";
  if (m.deferred) return "Deferred";
  return "Active";
}

function MilestoneRoadmapCard({
  m,
  onNavigate,
}: {
  m: Milestone;
  onNavigate: () => void;
}) {
  const cat = (m.category ?? "VALIDATION").toUpperCase();
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="group w-full rounded-xl border border-amber-500/20 bg-zinc-900/80 p-4 text-left transition hover:border-amber-500/40 hover:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200/90">
          {cat}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            m.completed && "bg-emerald-500/15 text-emerald-300",
            m.skipped && "bg-zinc-700 text-zinc-400",
            m.deferred && !m.skipped && !m.completed && "bg-amber-500/10 text-amber-200/80",
            !m.completed && !m.skipped && !m.deferred && "bg-zinc-800 text-zinc-300"
          )}
        >
          {statusLabel(m)}
        </span>
        {m.timeEstimate && (
          <span className="text-xs text-zinc-500">{m.timeEstimate}</span>
        )}
      </div>
      <h3 className="mt-2 font-semibold leading-snug text-zinc-100 group-hover:text-amber-100">
        {m.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{m.description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-400/90">
        Open full journey <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export default function VentureRoadmapTasksPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dnaOk, setDnaOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch(`/api/ventures/${ventureId}/milestones`),
        fetch(`/api/ventures/${ventureId}/dna`),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setDnaOk(Boolean(d && (d as { id?: string }).id));
      } else setDnaOk(false);
      if (mRes.ok) {
        const raw = await mRes.json();
        setMilestones(Array.isArray(raw) ? raw : []);
      } else setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateMilestones() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/milestones/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: false }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.milestones) setMilestones(data.milestones);
        else await load();
      }
    } finally {
      setGenerating(false);
    }
  }

  const goJourney = () => router.push(`/ventures/${ventureId}/journey`);

  const incomplete = sortJourneyMilestones(
    milestones.filter((m) => !m.completed && !m.skipped)
  );
  const active = incomplete[0] ? [incomplete[0]] : [];
  const upNext = incomplete.slice(1, 4);
  const later = incomplete.slice(4);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard?ventureId=${ventureId}`}
            className="text-sm text-zinc-500 hover:text-amber-200/90"
          >
            ← Back
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">
            Your AI-Generated Roadmap
          </h1>
          <p className="mt-1 text-zinc-400">
            Focus on what matters next — pulled from your journey milestones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={goJourney}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20"
          >
            <Map className="h-4 w-4" />
            View Full Journey
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading roadmap…
        </div>
      ) : milestones.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/60 p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-amber-400/80" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-100">No milestones yet</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {dnaOk === false
              ? "Complete your Venture DNA first so Ada can generate a personalized roadmap."
              : "Generate your 23-step AI roadmap in one click."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {dnaOk === false ? (
              <Link
                href={`/ventures/${ventureId}/dream`}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
              >
                Complete Venture DNA
              </Link>
            ) : (
              <button
                type="button"
                disabled={generating}
                onClick={() => void generateMilestones()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generating ? "Generating…" : "Generate roadmap"}
              </button>
            )}
            <button
              type="button"
              onClick={goJourney}
              className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Open journey page
            </button>
          </div>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-200/70">
              Active
            </h2>
            {active.length === 0 ? (
              <p className="text-sm text-zinc-500">No active milestone — you may have finished or skipped items.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                {active.map((m) => (
                  <MilestoneRoadmapCard key={m.id} m={m} onNavigate={goJourney} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-200/70">
              Up Next
            </h2>
            {upNext.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing queued — you&apos;re caught up on the next few steps.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                {upNext.map((m) => (
                  <MilestoneRoadmapCard key={m.id} m={m} onNavigate={goJourney} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-200/70">
              Later
            </h2>
            {later.length === 0 ? (
              <p className="text-sm text-zinc-500">No further steps in queue.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {later.map((m) => (
                  <MilestoneRoadmapCard key={m.id} m={m} onNavigate={goJourney} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
