"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";

type Analysis = {
  executiveSummary: string;
  uncontestedSpace: string;
  strategicOpportunities: string[];
  risksToValidate: string[];
  suggestedExperiments: string[];
};

type ScanSuccess = {
  jobId: string;
  status: "completed";
  completedAt: string;
  analysis: Analysis;
};

export default function BlueOceanPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanSuccess | null>(null);

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
        setResult(null);
        return;
      }
      if ((json as ScanSuccess).status === "completed" && (json as ScanSuccess).analysis) {
        setResult(json as ScanSuccess);
        return;
      }
      setError("Unexpected response from server.");
      setResult(null);
    } catch {
      setError("Network error. Try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

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
        Intake (VentureDNA) when available. Runs as one analysis; refresh anytime.
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
          {loading ? "Running scan…" : "Run Blue Ocean scan"}
        </button>
        <Link
          href={`/ventures/${ventureId}/dream`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Edit Dream Intake →
        </Link>
      </div>

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

      {!a && !error && !loading && (
        <p className="mt-10 text-sm text-slate-500">
          Run a scan to see Ada&apos;s Blue Ocean-style readout for this venture.
        </p>
      )}
    </div>
  );
}
