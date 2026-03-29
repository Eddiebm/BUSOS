"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VoiceInputButton } from "@/components/voice/VoiceInputButton";
type FounderExperience = "FIRST_TIME" | "REPEAT" | "SERIAL";

type CapitalOption = "" | "bootstrapped" | "pre-seed" | "seed" | "series-a";

interface DnaForm {
  dreamStatement: string;
  problemStatement: string;
  targetCustomer: string;
  whyNow: string;
  marketSize: string;
  industryVertical: string;
  founderWhy: string;
  unfairAdvantage: string;
  founderBackground: string;
  founderExperience: FounderExperience;
  coFounders: string;
  location: string;
  hoursPerWeek: string;
  capitalAvailable: CapitalOption;
  teamSize: string;
  hasPatentableIP: boolean;
  hasTrademarkNeeds: boolean;
}

const emptyForm = (): DnaForm => ({
  dreamStatement: "",
  problemStatement: "",
  targetCustomer: "",
  whyNow: "",
  marketSize: "",
  industryVertical: "",
  founderWhy: "",
  unfairAdvantage: "",
  founderBackground: "",
  founderExperience: "FIRST_TIME",
  coFounders: "",
  location: "",
  hoursPerWeek: "",
  capitalAvailable: "",
  teamSize: "1",
  hasPatentableIP: false,
  hasTrademarkNeeds: false,
});

const STEPS = 5;

export default function DreamIntakePage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DnaForm>(emptyForm);
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!ventureId) return;
    setLoading(true);
    fetch(`/api/ventures/${ventureId}/dna`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.id) {
          setHasExisting(true);
          setForm({
            dreamStatement: d.dreamStatement ?? "",
            problemStatement: d.problemStatement ?? "",
            targetCustomer: d.targetCustomer ?? "",
            whyNow: d.whyNow ?? "",
            marketSize: d.marketSize ?? "",
            industryVertical: d.industryVertical ?? "",
            founderWhy: d.founderWhy ?? "",
            unfairAdvantage: d.unfairAdvantage ?? "",
            founderBackground: d.founderBackground ?? "",
            founderExperience: d.founderExperience ?? "FIRST_TIME",
            coFounders: d.coFounders ?? "",
            location: d.location ?? "",
            hoursPerWeek: d.hoursPerWeek != null ? String(d.hoursPerWeek) : "",
            capitalAvailable: (d.capitalAvailable ?? "") as CapitalOption,
            teamSize: d.teamSize != null ? String(d.teamSize) : "1",
            hasPatentableIP: Boolean(d.hasPatentableIP),
            hasTrademarkNeeds: Boolean(d.hasTrademarkNeeds),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof DnaForm>(key: K, value: DnaForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const appendField = useCallback(<K extends keyof DnaForm>(key: K, text: string) => {
    const piece = text.trim();
    if (!piece) return;
    setForm((f) => {
      const cur = String(f[key] ?? "");
      const joined = cur ? `${cur} ${piece}` : piece;
      return { ...f, [key]: joined as DnaForm[K] };
    });
  }, []);

  const canNext = (): boolean => {
    if (step === 0) {
      return (
        form.dreamStatement.trim().length > 0 && form.problemStatement.trim().length > 0
      );
    }
    if (step === 2) return form.founderWhy.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (!canNext()) {
      setError("Please fill in the required fields for this step.");
      return;
    }
    setError(null);
    if (step < STEPS - 1) setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  };

  const submit = () => {
    if (step !== STEPS - 1) return;
    if (
      !form.dreamStatement.trim() ||
      !form.problemStatement.trim() ||
      !form.founderWhy.trim()
    ) {
      setError("Dream, problem, and your why are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    fetch(`/api/ventures/${ventureId}/dna`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dreamStatement: form.dreamStatement.trim(),
        problemStatement: form.problemStatement.trim(),
        targetCustomer: form.targetCustomer.trim() || null,
        whyNow: form.whyNow.trim() || null,
        marketSize: form.marketSize.trim() || null,
        industryVertical: form.industryVertical.trim() || null,
        founderWhy: form.founderWhy.trim(),
        unfairAdvantage: form.unfairAdvantage.trim() || null,
        founderBackground: form.founderBackground.trim() || null,
        founderExperience: form.founderExperience,
        coFounders: form.coFounders.trim() || null,
        location: form.location.trim() || null,
        hoursPerWeek:
          form.hoursPerWeek === "" ? null : Number.parseInt(form.hoursPerWeek, 10),
        capitalAvailable: form.capitalAvailable || null,
        teamSize: form.teamSize === "" ? 1 : Number.parseInt(form.teamSize, 10) || 1,
        hasPatentableIP: form.hasPatentableIP,
        hasTrademarkNeeds: form.hasTrademarkNeeds,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? "Save failed");
        router.push(`/ventures/${ventureId}/journey`);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Save failed");
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-[680px]">
        <div className="mb-8">
          <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-slate-200">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-full flex-1 border-r border-white last:border-0 transition-colors",
                  i <= step ? "bg-indigo-600" : "bg-transparent"
                )}
              />
            ))}
          </div>
          <p className="text-center text-sm text-slate-600">
            Step {step + 1} of {STEPS}
          </p>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
          {hasExisting ? "Update your founding story" : "Tell Ada your dream"}
        </h1>

        <div className="relative min-h-[480px] overflow-hidden">
          <div key={step} className="transition-opacity duration-300">
            {step === 0 && (
              <StepDream form={form} update={update} appendField={appendField} />
            )}
            {step === 1 && (
              <StepOpportunity form={form} update={update} appendField={appendField} />
            )}
            {step === 2 && (
              <StepWhy form={form} update={update} appendField={appendField} />
            )}
            {step === 3 && (
              <StepAbout form={form} update={update} appendField={appendField} />
            )}
            {step === 4 && (
              <StepResources form={form} update={update} />
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/80"
              >
                Back
              </button>
            ) : (
              <Link
                href={`/ventures/${ventureId}/journey`}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Skip for now
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            {step < STEPS - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext()}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !canNext()}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Start My Journey →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDream({
  form,
  update,
  appendField,
}: {
  form: DnaForm;
  update: <K extends keyof DnaForm>(key: K, value: DnaForm[K]) => void;
  appendField: <K extends keyof DnaForm>(key: K, text: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">What does the world look like if you win?</h2>
        <p className="mt-2 text-slate-600">
          Don&apos;t describe your product. Describe the world after your product exists and succeeds.
        </p>
        <label htmlFor="dream" className="sr-only">
          Dream statement
        </label>
        <div className="relative mt-4">
          <textarea
            id="dream"
            value={form.dreamStatement}
            onChange={(e) => update("dreamStatement", e.target.value)}
            rows={6}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            placeholder="Paint the picture…"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("dreamStatement", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
      <div>
        <p className="text-slate-700">
          What specific problem are you solving, and who feels it most painfully?
        </p>
        <label htmlFor="problem" className="sr-only">
          Problem statement
        </label>
        <div className="relative mt-2">
          <textarea
            id="problem"
            value={form.problemStatement}
            onChange={(e) => update("problemStatement", e.target.value)}
            rows={5}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("problemStatement", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
      <div>
        <p className="text-slate-700">Who exactly is your target customer? Be as specific as possible.</p>
        <label htmlFor="target" className="sr-only">
          Target customer
        </label>
        <div className="relative mt-2">
          <textarea
            id="target"
            value={form.targetCustomer}
            onChange={(e) => update("targetCustomer", e.target.value)}
            rows={4}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("targetCustomer", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
    </div>
  );
}

function StepOpportunity({
  form,
  update,
  appendField,
}: {
  form: DnaForm;
  update: <K extends keyof DnaForm>(key: K, value: DnaForm[K]) => void;
  appendField: <K extends keyof DnaForm>(key: K, text: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Why is now the right time?</h2>
        <p className="mt-2 text-slate-600">
          What changed in the world — technology, regulation, behavior, cost — that makes this possible
          today when it wasn&apos;t 5 years ago?
        </p>
        <div className="relative mt-4">
          <textarea
            value={form.whyNow}
            onChange={(e) => update("whyNow", e.target.value)}
            rows={5}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("whyNow", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
      <div>
        <label htmlFor="market" className="block text-sm font-medium text-slate-700">
          How big is the market opportunity?
        </label>
        <div className="relative mt-1">
          <textarea
            id="market"
            value={form.marketSize}
            onChange={(e) => update("marketSize", e.target.value)}
            rows={3}
            placeholder="e.g. $2B TAM in the US"
            className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-14 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("marketSize", text)}
            className="absolute right-2 top-2"
          />
        </div>
      </div>
      <div>
        <label htmlFor="vertical" className="block text-sm font-medium text-slate-700">
          What industry or vertical?
        </label>
        <div className="relative mt-1">
          <textarea
            id="vertical"
            value={form.industryVertical}
            onChange={(e) => update("industryVertical", e.target.value)}
            rows={3}
            placeholder="e.g. fintech, healthtech, edtech, logistics"
            className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-14 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("industryVertical", text)}
            className="absolute right-2 top-2"
          />
        </div>
      </div>
    </div>
  );
}

function StepWhy({
  form,
  update,
  appendField,
}: {
  form: DnaForm;
  update: <K extends keyof DnaForm>(key: K, value: DnaForm[K]) => void;
  appendField: <K extends keyof DnaForm>(key: K, text: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Why are YOU the one to build this?</h2>
        <p className="mt-2 text-slate-600">
          The most important question any investor — or co-founder — will ask you.
        </p>
        <div className="relative mt-4">
          <textarea
            value={form.founderWhy}
            onChange={(e) => update("founderWhy", e.target.value)}
            rows={6}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("founderWhy", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
      <div>
        <label htmlFor="unfair" className="block text-sm font-medium text-slate-700">
          What&apos;s your unfair advantage?
        </label>
        <p className="text-sm text-slate-500">
          Domain expertise, network, proprietary data, lived experience — what do you have that a
          well-funded competitor can&apos;t easily replicate?
        </p>
        <div className="relative mt-2">
          <textarea
            id="unfair"
            value={form.unfairAdvantage}
            onChange={(e) => update("unfairAdvantage", e.target.value)}
            rows={4}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("unfairAdvantage", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
    </div>
  );
}

function StepAbout({
  form,
  update,
  appendField,
}: {
  form: DnaForm;
  update: <K extends keyof DnaForm>(key: K, value: DnaForm[K]) => void;
  appendField: <K extends keyof DnaForm>(key: K, text: string) => void;
}) {
  const levels: { value: FounderExperience; label: string }[] = [
    { value: "FIRST_TIME", label: "First-time founder — this is my first venture" },
    { value: "REPEAT", label: "Repeat founder — I've built a company before" },
    { value: "SERIAL", label: "Serial founder — I've built and exited multiple companies" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tell Ada about yourself</h2>
        <p className="mt-2 text-slate-600">
          Ada uses this to calibrate every piece of advice to your actual situation.
        </p>
      </div>
      <div>
        <label htmlFor="bg" className="block text-sm font-medium text-slate-700">
          Your background & experience
        </label>
        <div className="relative mt-1">
          <textarea
            id="bg"
            value={form.founderBackground}
            onChange={(e) => update("founderBackground", e.target.value)}
            placeholder="e.g. 10 years in banking, built 2 startups before, deep network in healthcare"
            rows={4}
            className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-4 pr-14 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <VoiceInputButton
            onTranscript={(text) => appendField("founderBackground", text)}
            className="absolute right-2 top-3"
          />
        </div>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">Founder experience level</legend>
        {levels.map((l) => (
          <label key={l.value} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
            <input
              type="radio"
              name="founderExperience"
              value={l.value}
              checked={form.founderExperience === l.value}
              onChange={() => update("founderExperience", l.value)}
              className="mt-1 text-indigo-600"
            />
            <span className="text-sm text-slate-800">{l.label}</span>
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="cofounders" className="block text-sm font-medium text-slate-700">
          Co-founders
        </label>
        <input
          id="cofounders"
          type="text"
          value={form.coFounders}
          onChange={(e) => update("coFounders", e.target.value)}
          placeholder="e.g. Jane Smith (CTO), John Doe (CMO) — or leave blank if solo"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      <div>
        <label htmlFor="loc" className="block text-sm font-medium text-slate-700">
          Location
        </label>
        <input
          id="loc"
          type="text"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="e.g. Lagos, Nigeria"
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
    </div>
  );
}

function StepResources({
  form,
  update,
}: {
  form: DnaForm;
  update: <K extends keyof DnaForm>(key: K, value: DnaForm[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Let&apos;s be real about your resources</h2>
        <p className="mt-2 text-slate-600">
          Ada won&apos;t give you advice that ignores your constraints.
        </p>
      </div>
      <div>
        <label htmlFor="hours" className="block text-sm font-medium text-slate-700">
          Hours per week you can dedicate to this venture
        </label>
        <input
          id="hours"
          type="number"
          min={0}
          max={168}
          value={form.hoursPerWeek}
          onChange={(e) => update("hoursPerWeek", e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      <div>
        <label htmlFor="capital" className="block text-sm font-medium text-slate-700">
          Capital available
        </label>
        <select
          id="capital"
          value={form.capitalAvailable}
          onChange={(e) => update("capitalAvailable", e.target.value as CapitalOption)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="">Select…</option>
          <option value="bootstrapped">Bootstrapped — using personal savings</option>
          <option value="pre-seed">Pre-seed — raised or have access to &lt; $500K</option>
          <option value="seed">Seed funded — raised $500K–$5M</option>
          <option value="series-a">Series A+ — raised &gt; $5M</option>
        </select>
      </div>
      <div>
        <label htmlFor="team" className="block text-sm font-medium text-slate-700">
          Team size (including you)
        </label>
        <input
          id="team"
          type="number"
          min={1}
          value={form.teamSize}
          onChange={(e) => update("teamSize", e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          id="patent"
          type="checkbox"
          checked={form.hasPatentableIP}
          onChange={(e) => update("hasPatentableIP", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="patent" className="text-sm text-slate-800">
          Does your venture involve patentable technology or processes?
        </label>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          id="tm"
          type="checkbox"
          checked={form.hasTrademarkNeeds}
          onChange={(e) => update("hasTrademarkNeeds", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="tm" className="text-sm text-slate-800">
          Does your venture need trademark protection?
        </label>
      </div>
      <p className="text-sm text-slate-500">
        Ada will automatically schedule IP filings and legal steps in your Journey Roadmap based on your
        answers.
      </p>
    </div>
  );
}
