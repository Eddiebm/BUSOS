"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { Milestone } from "@/components/journey/MilestoneCard";

export type MvpFeature = { text: string; inMvp: boolean };

function parseFeatures(data: unknown): MvpFeature[] {
  if (!data || typeof data !== "object") return [];
  const raw = (data as { features?: unknown }).features;
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => {
    if (typeof f === "string") return { text: f, inMvp: false };
    if (f && typeof f === "object") {
      const o = f as Record<string, unknown>;
      return {
        text: String(o.text ?? ""),
        inMvp: Boolean(o.inMvp),
      };
    }
    return { text: "", inMvp: false };
  });
}

type Props = {
  milestone: Milestone;
  onSave: (data: unknown) => void;
};

const TEXT_DEBOUNCE_MS = 400;

export function MvpFeatureList({ milestone, onSave }: Props) {
  const [features, setFeatures] = useState<MvpFeature[]>(() => parseFeatures(milestone.workspaceData));
  const [draft, setDraft] = useState("");
  const textTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mvpCount = useMemo(() => features.filter((f) => f.inMvp && f.text.trim()).length, [features]);

  function flushTextDebounce() {
    if (textTimer.current) {
      clearTimeout(textTimer.current);
      textTimer.current = null;
    }
  }

  function pushSaveImmediate(next: MvpFeature[]) {
    flushTextDebounce();
    setFeatures(next);
    onSave({ features: next });
  }

  function addFeature() {
    const t = draft.trim();
    if (!t) return;
    pushSaveImmediate([...features, { text: t, inMvp: false }]);
    setDraft("");
  }

  function remove(i: number) {
    pushSaveImmediate(features.filter((_, j) => j !== i));
  }

  function toggleMvp(i: number) {
    pushSaveImmediate(
      features.map((f, j) => (j === i ? { ...f, inMvp: !f.inMvp } : f))
    );
  }

  useEffect(() => {
    return () => {
      if (textTimer.current) clearTimeout(textTimer.current);
    };
  }, []);

  function updateText(i: number, text: string) {
    flushTextDebounce();
    setFeatures((prev) => {
      const next = prev.map((f, j) => (j === i ? { ...f, text } : f));
      textTimer.current = setTimeout(() => onSave({ features: next }), TEXT_DEBOUNCE_MS);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-amber-200/90">
        <span className="font-semibold text-amber-300">{mvpCount}</span> features in MVP
      </p>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-2"
          >
            <input
              type="checkbox"
              checked={f.inMvp}
              onChange={() => toggleMvp(i)}
              className="mt-2 h-4 w-4 rounded border-zinc-600"
              title="In MVP"
            />
            <input
              type="text"
              value={f.text}
              onChange={(e) => updateText(i, e.target.value)}
              className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              placeholder="Feature"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded px-2 py-1 text-lg leading-none text-zinc-500 hover:bg-zinc-800 hover:text-amber-400"
              aria-label="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
          placeholder="New feature…"
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
        <button
          type="button"
          onClick={addFeature}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Add feature
        </button>
      </div>
    </div>
  );
}
