"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

type Analysis = {
  executiveSummary: string;
  uncontestedSpace: string;
  strategicOpportunities: string[];
  risksToValidate: string[];
  suggestedExperiments: string[];
};

type ScanRow = {
  id: string;
  jobId: string;
  analysis: Analysis;
  createdAt: string;
};

type ScanSuccess = {
  id?: string;
  jobId: string;
  status: "completed";
  completedAt: string;
  analysis: Analysis;
};

function isAnalysis(x: unknown): x is Analysis {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.executiveSummary === "string";
}

export default function BlueOceanPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanSuccess | null>(null);
  const [history, setHistory] = useState<ScanRow[]>([]);
  const seededFromHistory = useRef(false);

  useEffect(() => {
    seededFromHistory.current = false;
  }, [ventureId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/blue-ocean`);
      if (!res.ok) return;
      const rows = (await res.json()) as Array<{
        id: string;
        jobId: string;
        analysis: unknown;
        createdAt: string;
      }>;
      const parsed: ScanRow[] = [];
      for (const r of rows) {
        if (isAnalysis(r.analysis)) {
          parsed.push({
            id: r.id,
            jobId: r.jobId,
            analysis: r.analysis,
            createdAt: r.createdAt,
          });
        }
      }
      setHistory(parsed);
      if (parsed.length > 0 && !seededFromHistory.current) {
        seededFromHistory.current = true;
        const latest = parsed[0];
        setResult({
          id: latest.id,
          jobId: latest.jobId,
          status: "completed",
          completedAt: latest.createdAt,
          analysis: latest.analysis,
        });
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/blue-ocean`, {
        method: "POST",
      });
      const json = (await res.json()) as ScanSuccess | { error?: string };
      if (!res.ok) {
        const fromJson =
          typeof (json as { error?: string }).error === "string"
            ? (json as { error: string }).error
            : null;
        const msg = fromJson ?? `Request failed (${res.status})`;
        setError(msg);
        return;
      }
      if ((json as ScanSuccess).status === "completed" && (json as ScanSuccess).analysis) {
        const s = json as ScanSuccess;
        seededFromHistory.current = true;
        setResult(s);
        const resList = await fetch(`/api/ventures/${ventureId}/blue-ocean`);
        if (resList.ok) {
          const rows = (await resList.json()) as Array<{
            id: string;
            jobId: string;
            analysis: unknown;
            createdAt: string;
          }>;
          const parsed: ScanRow[] = [];
          for (const r of rows) {
            if (isAnalysis(r.analysis)) {
              parsed.push({
                id: r.id,
                jobId: r.jobId,
                analysis: r.analysis,
                createdAt: r.createdAt,
              });
            }
          }
          setHistory(parsed);
        }
        return;
      }
      setError("Unexpected response from server.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  const selectScan = useCallback((row: ScanRow) => {
    setResult({
      id: row.id,
      jobId: row.jobId,
      status: "completed",
      completedAt: row.createdAt,
      analysis: row.analysis,
    });
    setError(null);
  }, []);

  const a = result?.analysis;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Waves className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Strategy
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Blue Ocean scan</h1>
        </div>
      </div>

      <p className="text-slate-600">
        A focused pass on differentiation and uncontested demand — grounded in your venture and Dream
        Intake (VentureDNA) when available. Each run is saved so you can compare over time.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runScan}
          disabled={loading}
          className={cn(
            "rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          )}
        >
          {loading ? "Running scan…" : "Run new scan"}
        </button>
        <Link
          href={`/ventures/${ventureId}/dream`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Edit Dream Intake →
        </Link>
      </div>

      {historyLoading && (
        <p className="mt-6 text-sm text-slate-500">Loading scan history…</p>
      )}

      {!historyLoading && history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-800">Saved scans</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {history.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => selectScan(row)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    result?.id === row.id
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {new Date(row.createdAt).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div
          className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {error}
        </div>
      )}

      {a && (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Executive summary</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {a.executiveSummary}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Uncontested space</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {a.uncontestedSpace}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Strategic opportunities</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {a.strategicOpportunities.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Risks to validate</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {a.risksToValidate.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Suggested experiments (30 days)</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {a.suggestedExperiments.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {result?.completedAt && (
            <p className="text-xs text-slate-500">
              Completed {new Date(result.completedAt).toLocaleString()}
              {result.jobId ? ` · Ref ${result.jobId}` : ""}
            </p>
          )}
        </div>
      )}

      {!a && !error && !loading && !historyLoading && history.length === 0 && (
        <p className="mt-10 text-sm text-slate-500">
          Run a scan to see Ada&apos;s Blue Ocean-style readout for this venture.
        </p>
      )}
    </div>
  );
}
