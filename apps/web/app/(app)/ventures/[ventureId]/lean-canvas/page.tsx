"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import {
  emptyBlocks,
  formatLeanCanvasMarkdown,
  LEAN_CANVAS_BLOCK_KEYS,
  LEAN_CANVAS_LABELS,
  type LeanCanvasBlocks,
} from "@/lib/lean-canvas";
import { cn } from "@/lib/utils";

function blocksEqual(a: LeanCanvasBlocks, b: LeanCanvasBlocks): boolean {
  return LEAN_CANVAS_BLOCK_KEYS.every((k) => a[k] === b[k]);
}

export default function LeanCanvasPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LeanCanvasBlocks>(emptyBlocks);
  const [baseline, setBaseline] = useState<LeanCanvasBlocks>(emptyBlocks);
  const [ventureName, setVentureName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [canvasRes, ventureRes] = await Promise.all([
        fetch(`/api/ventures/${ventureId}/lean-canvas`),
        fetch(`/api/ventures/${ventureId}`),
      ]);
      if (ventureRes.ok) {
        const v = (await ventureRes.json()) as { name?: string };
        setVentureName(typeof v.name === "string" ? v.name : null);
      }
      if (!canvasRes.ok) {
        setError(canvasRes.status === 401 ? "Sign in to view this canvas." : "Could not load canvas.");
        return;
      }
      const json = (await canvasRes.json()) as {
        blocks: LeanCanvasBlocks;
        persisted: boolean;
        updatedAt: string | null;
      };
      setBlocks(json.blocks);
      setBaseline(json.blocks);
      setPersisted(json.persisted);
      setUpdatedAt(json.updatedAt);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = !blocksEqual(blocks, baseline);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/lean-canvas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Save failed (${res.status})`);
        return;
      }
      const json = (await res.json()) as {
        blocks: LeanCanvasBlocks;
        persisted: boolean;
        updatedAt: string;
      };
      setBlocks(json.blocks);
      setBaseline(json.blocks);
      setPersisted(json.persisted);
      setUpdatedAt(json.updatedAt);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }, [ventureId, blocks]);

  const reseed = useCallback(async () => {
    if (
      dirty &&
      !globalThis.confirm("You have unsaved edits. Replace the canvas from Venture DNA anyway?")
    ) {
      return;
    }
    setReseedLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/lean-canvas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reseed" }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Could not reseed (${res.status})`);
        return;
      }
      const json = (await res.json()) as {
        blocks: LeanCanvasBlocks;
        updatedAt: string;
      };
      setBlocks(json.blocks);
      setBaseline(json.blocks);
      setPersisted(true);
      setUpdatedAt(json.updatedAt);
    } catch {
      setError("Network error.");
    } finally {
      setReseedLoading(false);
    }
  }, [ventureId, dirty]);

  const onChange = (key: keyof LeanCanvasBlocks, value: string) => {
    setBlocks((prev) => ({ ...prev, [key]: value }));
  };

  const exportMarkdown = useCallback(() => {
    const md = formatLeanCanvasMarkdown(blocks, {
      ventureName: ventureName ?? undefined,
      exportedAt: new Date(),
    });
    const safe =
      (ventureName ?? "venture")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 48) || "venture";
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lean-canvas-${safe}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks, ventureName]);

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <LayoutGrid className="h-6 w-6 shrink-0" aria-hidden />
            <span className="text-sm font-medium uppercase tracking-wide">Strategy</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Lean Canvas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A one-page, living model linked to your venture and{" "}
            <Link href={`/ventures/${ventureId}/dream`} className="font-medium text-info underline-offset-2 hover:underline">
              Venture DNA
            </Link>
            . Save edits here; use &quot;Fill from DNA&quot; to overwrite with the latest intake snapshot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportMarkdown}
            disabled={loading}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-background disabled:opacity-50"
          >
            Export Markdown
          </button>
          <button
            type="button"
            onClick={reseed}
            disabled={reseedLoading || loading}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-background disabled:opacity-50"
          >
            {reseedLoading ? "Filling…" : "Fill from DNA"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !dirty}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm",
              dirty ? "bg-info hover:bg-info/90" : "bg-muted cursor-not-allowed"
            )}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <p className="mb-6 text-xs text-muted-foreground">
        {loading && "Loading…"}
        {!loading && (
          <>
            {persisted ? (
              <>
                Last saved{" "}
                {updatedAt
                  ? new Date(updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </>
            ) : (
              "Not saved yet — edits stay on this device until you save."
            )}
            {dirty && " · Unsaved changes"}
          </>
        )}
      </p>

      {loading ? (
        <div className="rounded-xl border border-border bg-background p-12 text-center text-muted-foreground">
          Loading canvas…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {LEAN_CANVAS_BLOCK_KEYS.map((key) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {LEAN_CANVAS_LABELS[key]}
              </span>
              <textarea
                value={blocks[key]}
                onChange={(e) => onChange(key, e.target.value)}
                rows={key === "problem" || key === "uniqueValueProposition" ? 5 : 4}
                className="min-h-[96px] w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="…"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
