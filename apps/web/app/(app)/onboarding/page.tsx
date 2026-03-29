"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/ventures")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          router.replace(`/dashboard?ventureId=${list[0].id}`);
          return;
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create");
      toast.success("Venture created");
      router.replace(`/dashboard?ventureId=${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-8 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Create your first venture</h1>
        <p className="mt-2 text-slate-600">
          Give your startup or project a name. You can add details and runway later.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="Create first venture"
      >
        <label htmlFor="onboarding-venture-name" className="block text-sm font-medium text-slate-700">
          Venture name
        </label>
        <input
          id="onboarding-venture-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Inc"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {loading ? "Creating…" : "Create and go to dashboard"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        <button
          type="button"
          onClick={() => router.push("/ventures")}
          className="underline hover:text-slate-700"
        >
          Skip to ventures
        </button>
      </p>
    </div>
  );
}
