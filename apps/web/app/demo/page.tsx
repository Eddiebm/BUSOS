"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type DemoMilestone = {
  step: number;
  title: string;
  description: string;
  category: string;
};

const CAPITAL_OPTIONS = [
  "Bootstrapped",
  "Pre-seed (<$50K)",
  "Seed ($50K–$2M)",
  "Series A+",
] as const;

const EXPERIENCE_OPTIONS = [
  { value: "first_time", label: "First-time founder" },
  { value: "repeat", label: "Repeat founder (built a company before)" },
  { value: "serial", label: "Serial founder (built and exited multiple)" },
] as const;

const CATEGORY_RING: Record<string, string> = {
  VALIDATION: "ring-indigo-300 bg-indigo-50",
  PRODUCT: "ring-blue-300 bg-blue-50",
  LEGAL: "ring-amber-300 bg-amber-50",
  FINANCIAL: "ring-green-300 bg-green-50",
  GROWTH: "ring-purple-300 bg-purple-50",
  IP: "ring-rose-300 bg-rose-50",
};

export default function DemoPage() {
  const [problem, setProblem] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [capitalAvailable, setCapitalAvailable] = useState<string>(CAPITAL_OPTIONS[0]);
  const [founderExperience, setFounderExperience] = useState<string>(EXPERIENCE_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaResponse, setAdaResponse] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<DemoMilestone[]>([]);
  const [showOutput, setShowOutput] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hours = Number(hoursPerWeek);
    if (!problem.trim() || !Number.isFinite(hours) || hours <= 0) {
      setError("Describe your problem and enter valid hours per week.");
      return;
    }
    setError(null);
    setLoading(true);
    setShowOutput(false);
    setAdaResponse(null);
    setMilestones([]);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          hoursPerWeek: hours,
          capitalAvailable,
          founderExperience,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Something went wrong.");
        return;
      }
      setAdaResponse(String(json.adaResponse ?? ""));
      setMilestones(Array.isArray(json.milestones) ? json.milestones : []);
      setShowOutput(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <div className="flex-1 bg-white p-8 md:p-12 lg:max-w-none">
          <h1 className="text-2xl font-bold text-slate-900">Try BUSOS in 60 seconds</h1>
          <p className="mt-2 text-slate-600">
            No account required. Ada will respond to your real situation.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-8">
            <div>
              <label htmlFor="problem" className="block text-sm font-medium text-slate-800">
                What problem are you solving?
              </label>
              <textarea
                id="problem"
                rows={5}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. Small businesses in Ghana can't access working capital without collateral"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">Your resources</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="hours" className="block text-xs text-slate-600">
                    Hours per week
                  </label>
                  <input
                    id="hours"
                    type="number"
                    min={1}
                    max={168}
                    placeholder="e.g. 15"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label htmlFor="capital" className="block text-xs text-slate-600">
                    Capital available
                  </label>
                  <select
                    id="capital"
                    value={capitalAvailable}
                    onChange={(e) => setCapitalAvailable(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {CAPITAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-slate-800">Your experience</legend>
              <div className="mt-3 space-y-2">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="experience"
                      value={opt.value}
                      checked={founderExperience === opt.value}
                      onChange={() => setFounderExperience(opt.value)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto sm:px-8"
            >
              {loading ? "Ada is thinking…" : "Show me my roadmap →"}
            </button>
          </form>
        </div>

        <div
          className={cn(
            "flex-1 border-t border-slate-200 bg-slate-50 p-8 transition-opacity duration-500 md:border-t-0 md:border-l lg:max-w-none",
            showOutput ? "opacity-100" : "opacity-40"
          )}
        >
          {!showOutput && !loading && (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center text-slate-500">
              <p className="max-w-sm text-sm">
                Submit the form to see Ada&apos;s assessment and your first seven milestones.
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-4 py-4">
              <p className="text-sm font-medium text-slate-600">Ada is thinking…</p>
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-[80%] animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-[60%] animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          )}

          {showOutput && adaResponse && !loading && (
            <div className="space-y-10">
              <section>
                <h2 className="text-lg font-bold text-slate-900">Ada&apos;s Assessment</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{adaResponse}</p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-900">Your First Steps</h2>
                <ul className="mt-4 space-y-3">
                  {milestones.map((m) => {
                    const cat = (m.category || "VALIDATION").toUpperCase();
                    const ring = CATEGORY_RING[cat] ?? "ring-slate-300 bg-slate-50";
                    return (
                      <li
                        key={m.step}
                        className={cn(
                          "rounded-xl border border-slate-200 p-4 ring-1",
                          ring
                        )}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Step {m.step} · {cat}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">{m.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div>
                <Link
                  href="/sign-up"
                  className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
                >
                  Start your full journey — free
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
