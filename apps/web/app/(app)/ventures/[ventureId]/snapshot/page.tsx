"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { VentureSnapshotPayload } from "@/lib/venture-snapshot";
import { formatValuePropositionSentence } from "@/lib/venture-snapshot";
import { cn } from "@/lib/utils";

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const SECTIONS: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "value-prop", label: "Value proposition" },
  { id: "competitors", label: "Competitive landscape" },
  { id: "mvp", label: "MVP scope" },
  { id: "financial", label: "Financial model" },
  { id: "team", label: "Team" },
  { id: "progress", label: "Progress" },
];

export default function VentureSnapshotPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [data, setData] = useState<VentureSnapshotPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/ventures/${ventureId}/snapshot`)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? `Request failed (${r.status})`);
        }
        return r.json() as Promise<VentureSnapshotPayload>;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ventureId]);

  const exportHref = `/api/ventures/${ventureId}/snapshot/export`;
  const vpSentence = data ? formatValuePropositionSentence(data.valueProposition) : "";
  const inMvp = data?.mvpFeatures.filter((f) => f.inMvp && f.text.trim()) ?? [];
  const futureMvp = data?.mvpFeatures.filter((f) => !f.inMvp && f.text.trim()) ?? [];
  const progressPct =
    data && data.totalMilestones > 0
      ? Math.round((data.completedMilestones / data.totalMilestones) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/90">
              Venture snapshot
            </p>
            <h1 className="text-xl font-semibold text-foreground">
              {loading ? "Loading…" : data?.ventureName ?? "Snapshot"}
            </h1>
          </div>
          <a
            href={exportHref}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20",
              (loading || error) && "pointer-events-none opacity-40"
            )}
            download
          >
            <Download className="h-4 w-4" aria-hidden />
            Export to PDF
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row lg:gap-12 sm:px-6">
        <aside className="lg:w-48 lg:flex-shrink-0">
          <nav
            className="sticky top-24 space-y-1 rounded-xl border border-border bg-card/50 p-3 text-sm lg:block"
            aria-label="On this page"
          >
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-12 pb-16">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading snapshot…
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/35 bg-destructive/15 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              <section id="overview" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">Overview</h2>
                <div className="rounded-xl border border-border bg-card/40 p-6">
                  <h3 className="text-2xl font-semibold text-foreground">{data.ventureName}</h3>
                  {data.ventureDescription ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.ventureDescription}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-muted-foreground">No description yet.</p>
                  )}
                  {data.dna && (
                    <div className="mt-6 border-t border-border pt-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        DNA highlights
                      </p>
                      {(data.dna as { dreamStatement?: string }).dreamStatement ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {(data.dna as { dreamStatement?: string }).dreamStatement}
                        </p>
                      ) : null}
                      {(data.dna as { problemStatement?: string }).problemStatement ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="text-muted-foreground">Problem: </span>
                          {(data.dna as { problemStatement?: string }).problemStatement}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </section>

              <section id="value-prop" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">Value proposition</h2>
                <div className="rounded-xl border border-primary/35 bg-card/60 p-6">
                  {vpSentence ? (
                    <p className="text-sm leading-relaxed text-foreground">{vpSentence}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Complete a value proposition milestone on your Journey to populate this section.
                    </p>
                  )}
                </div>
              </section>

              <section id="competitors" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">Competitive landscape</h2>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card/80">
                        <th className="px-4 py-3 font-semibold text-primary">Competitor</th>
                        <th className="px-4 py-3 font-semibold text-primary">Pricing</th>
                        <th className="px-4 py-3 font-semibold text-primary">Strengths</th>
                        <th className="px-4 py-3 font-semibold text-primary">Weaknesses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.competitors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            No competitor matrix data yet. Add it from a Journey milestone.
                          </td>
                        </tr>
                      ) : (
                        data.competitors.map((c, i) => (
                          <tr key={i} className="border-b border-border/80">
                            <td className="px-4 py-3 text-foreground">{c.name || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.pricing || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.strengths || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{c.weaknesses || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="mvp" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">MVP scope</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card/40 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-success/90">
                      In MVP
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {inMvp.length === 0 ? (
                        <li className="text-muted-foreground">—</li>
                      ) : (
                        inMvp.map((f, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary/80">✓</span>
                            {f.text}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border bg-card/40 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Future
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {futureMvp.length === 0 ? (
                        <li className="text-muted-foreground">—</li>
                      ) : (
                        futureMvp.map((f, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-muted-foreground">○</span>
                            {f.text}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </section>

              <section id="financial" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">Financial model</h2>
                {data.financialModel ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Starting users (month 1)</p>
                        <p className="mt-1 font-medium text-foreground">
                          {fmtMoney(data.financialModel.startingUsers)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Revenue per user / month</p>
                        <p className="mt-1 font-medium text-foreground">
                          {fmtMoney(data.financialModel.revenuePerUser)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
                        <p className="text-xs text-muted-foreground">User growth % / month</p>
                        <p className="mt-1 font-medium text-foreground">
                          {data.financialModel.monthlyGrowthPct}%
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
                        <p className="text-xs text-muted-foreground">COGS % of revenue</p>
                        <p className="mt-1 font-medium text-foreground">{data.financialModel.cogsPct}%</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Fixed costs / month</p>
                        <p className="mt-1 font-medium text-foreground">
                          {fmtMoney(data.financialModel.fixedMonthlyCosts)}
                        </p>
                      </div>
                    </div>
                    {data.financialSummary && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          12-month projection (totals)
                        </p>
                        <div className="mt-4 flex flex-wrap gap-8">
                          <div>
                            <p className="text-xs text-muted-foreground">Year 1 revenue (sum)</p>
                            <p className="text-xl font-semibold text-foreground">
                              {fmtMoney(data.financialSummary.yearOneRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Year 1 net profit (sum)</p>
                            <p
                              className={cn(
                                "text-xl font-semibold",
                                data.financialSummary.yearOneNetProfit >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              )}
                            >
                              {fmtMoney(data.financialSummary.yearOneNetProfit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No financial model workspace data yet. Complete the relevant Journey milestone.
                  </p>
                )}
              </section>

              <section id="team" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">Team</h2>
                <ul className="space-y-2 rounded-xl border border-border bg-card/40 p-5">
                  {data.team.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No venture members listed yet.</li>
                  ) : (
                    data.team.map((t, i) => (
                      <li key={i} className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="text-foreground">{t.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {t.role}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section id="progress" className="scroll-mt-28">
                <h2 className="mb-3 text-lg font-semibold text-primary">Progress</h2>
                <div className="rounded-xl border border-border bg-card/40 p-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {data.completedMilestones} of {data.totalMilestones} milestones complete
                    </span>
                    <span className="text-primary">{progressPct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/75 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    <Link href={`/ventures/${ventureId}/journey`} className="text-primary hover:underline">
                      Open Journey
                    </Link>{" "}
                    to update milestones.
                  </p>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
