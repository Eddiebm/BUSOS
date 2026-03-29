"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { VentureSummary } from "@/types/api";
import { VenturesListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function VenturesPage() {
  const router = useRouter();
  const [ventures, setVentures] = useState<VentureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchVentures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ventures");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? res.statusText);
      setVentures(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setVentures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentures();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Create failed");
      setCreateName("");
      setVentures((prev) => [data, ...prev]);
      toast.success("Venture created");
      if (data?.id) {
        router.push(`/ventures/${data.id}/dream`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Create failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ventures</h1>
        <VenturesListSkeleton />
      </div>
    );

  if (error)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ventures</h1>
        <ErrorState message={error} onRetry={fetchVentures} />
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Ventures</h1>

      <form onSubmit={handleCreate} className="flex gap-2" aria-label="Create venture">
        <label htmlFor="venture-name-input" className="sr-only">
          New venture name
        </label>
        <input
          id="venture-name-input"
          type="text"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="New venture name"
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-border focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={creating || !createName.trim()}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50 hover:bg-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </form>

      {ventures.length === 0 ? (
        <EmptyState
          title="No ventures yet"
          description="Create your first venture above to get started with BUSOS."
          actionLabel="Create venture"
          onAction={() => document.getElementById("venture-name-input")?.focus()}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {ventures.map((v) => (
            <li
              key={v.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow"
            >
              <Link href={`/dashboard?ventureId=${v.id}`} className="block">
                <h2 className="font-semibold text-foreground">{v.name}</h2>
                {v.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Stage {v.stage}</span>
                  <span>Stress {v.stressLevel}%</span>
                  {v.cashRunwayMonths != null && (
                    <span>Runway {v.cashRunwayMonths} mo</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
