"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  ListChecks,
  AlertTriangle,
  SkipForward,
  CalendarClock,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  VALIDATION: "bg-blue-50 text-blue-700 border-blue-200",
  LEGAL: "bg-purple-50 text-purple-700 border-purple-200",
  FINANCIAL: "bg-green-50 text-green-700 border-green-200",
  PRODUCT: "bg-orange-50 text-orange-700 border-orange-200",
  GROWTH: "bg-pink-50 text-pink-700 border-pink-200",
  OPERATIONS: "bg-slate-50 text-slate-700 border-slate-200",
  IP: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const CATEGORY_RING: Record<string, string> = {
  VALIDATION: "ring-blue-200",
  LEGAL: "ring-purple-200",
  FINANCIAL: "ring-green-200",
  PRODUCT: "ring-orange-200",
  GROWTH: "ring-pink-200",
  OPERATIONS: "ring-slate-200",
  IP: "ring-yellow-200",
};

export interface Milestone {
  id: string;
  order: number;
  category: string;
  title: string;
  description: string;
  reason?: string | null;
  whyThisOrder?: string | null;
  timeEstimate?: string | null;
  whereToDoIt?: string | null;
  howToDoIt?: string | null;
  canSkip?: boolean;
  skipConsequence?: string | null;
  completed: boolean;
  completedAt?: string | null;
  skipped: boolean;
  skipReason?: string | null;
  deferred?: boolean;
  deferredUntil?: string | null;
  dueDate?: string | null;
  aiGenerated: boolean;
}

interface MilestoneCardProps {
  milestone: Milestone;
  ventureId: string;
  onUpdate: (updated: Milestone) => void;
}

export function MilestoneCard({ milestone: m, ventureId, onUpdate }: MilestoneCardProps) {
  const [open, setOpen] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showDeferModal, setShowDeferModal] = useState(false);
  const [skipReason, setSkipReason] = useState(m.skipReason ?? "");
  const [deferDate, setDeferDate] = useState(
    m.deferredUntil ? m.deferredUntil.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);

  const cat = (m.category ?? "VALIDATION").toUpperCase();
  const colorClass = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.VALIDATION;
  const ringClass = CATEGORY_RING[cat] ?? CATEGORY_RING.VALIDATION;

  async function patch(data: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/milestones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleComplete() {
    patch({ completed: !m.completed });
  }

  function handleSkip() {
    patch({ skipped: true, skipReason: skipReason || "Decided to skip" });
    setShowSkipModal(false);
  }

  function handleUnskip() {
    patch({ skipped: false, skipReason: null });
  }

  function handleDefer() {
    patch({ deferred: true, deferredUntil: deferDate || null });
    setShowDeferModal(false);
  }

  function handleUndefer() {
    patch({ deferred: false, deferredUntil: null });
  }

  const isOverdue =
    m.dueDate && !m.completed && !m.skipped && new Date(m.dueDate) < new Date();

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-all",
        m.completed && "opacity-60",
        m.skipped && "opacity-50 border-dashed",
        m.deferred && !m.skipped && "border-amber-200 bg-amber-50/30",
        isOverdue && !m.completed && !m.skipped && "border-red-200",
        `ring-1 ${ringClass}`
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Complete toggle */}
        <button
          type="button"
          onClick={toggleComplete}
          disabled={loading || m.skipped}
          className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
          aria-label={m.completed ? "Mark incomplete" : "Mark complete"}
        >
          {m.completed ? (
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400">#{m.order}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", colorClass)}>
              {cat}
            </span>
            {m.timeEstimate && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {m.timeEstimate}
              </span>
            )}
            {m.skipped && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Skipped
              </span>
            )}
            {m.deferred && !m.skipped && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Deferred{m.deferredUntil ? ` until ${new Date(m.deferredUntil).toLocaleDateString()}` : ""}
              </span>
            )}
            {isOverdue && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Overdue
              </span>
            )}
          </div>

          <h3
            className={cn(
              "font-semibold text-slate-900 leading-snug",
              m.completed && "line-through text-slate-400",
              m.skipped && "line-through text-slate-400"
            )}
          >
            {m.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{m.description}</p>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label={open ? "Collapse details" : "Expand details"}
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-5 pt-4 space-y-5">

          {/* Why this matters */}
          {m.reason && (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Why this matters for your venture
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{m.reason}</p>
            </section>
          )}

          {/* Why this order */}
          {m.whyThisOrder && (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                <ListChecks className="h-3.5 w-3.5 text-indigo-500" />
                Why do this now (not later)
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{m.whyThisOrder}</p>
            </section>
          )}

          {/* Where to do it */}
          {m.whereToDoIt && (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-green-500" />
                Where &amp; how to do it
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{m.whereToDoIt}</p>
            </section>
          )}

          {/* Step-by-step instructions */}
          {m.howToDoIt && (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                <ListChecks className="h-3.5 w-3.5 text-blue-500" />
                Step-by-step
              </h4>
              <div className="space-y-1.5">
                {m.howToDoIt.split(/\n/).filter(Boolean).map((step, i) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skip consequence warning */}
          {m.skipConsequence && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                If you skip this
              </h4>
              <p className="text-sm text-amber-800 leading-relaxed">{m.skipConsequence}</p>
            </section>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!m.completed && !m.skipped && (
              <button
                type="button"
                onClick={toggleComplete}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                Mark complete
              </button>
            )}

            {m.completed && (
              <button
                type="button"
                onClick={toggleComplete}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Mark incomplete
              </button>
            )}

            {!m.skipped && !m.completed && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeferModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Defer
                </button>
                <button
                  type="button"
                  onClick={() => setShowSkipModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip this task
                </button>
              </>
            )}

            {m.skipped && (
              <button
                type="button"
                onClick={handleUnskip}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore task
              </button>
            )}

            {m.deferred && !m.skipped && (
              <button
                type="button"
                onClick={handleUndefer}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Move back to active
              </button>
            )}
          </div>

          {/* Skip reason if already skipped */}
          {m.skipped && m.skipReason && (
            <p className="text-xs text-slate-500 italic">Reason: {m.skipReason}</p>
          )}
        </div>
      )}

      {/* Skip modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Skip this task?</h3>
            {m.skipConsequence && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <strong>Heads up:</strong> {m.skipConsequence}
              </div>
            )}
            <p className="text-sm text-slate-600 mb-3">
              You can always restore this task later. What&apos;s your reason for skipping?
            </p>
            <textarea
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="e.g. Not relevant for my business model, will revisit later…"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Skip task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defer modal */}
      {showDeferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Defer this task</h3>
            <p className="text-sm text-slate-600 mb-4">
              This task will be moved to your deferred list. Set a date to be reminded when to come back to it.
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Come back to this on
            </label>
            <input
              type="date"
              value={deferDate}
              onChange={(e) => setDeferDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeferModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDefer}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Defer task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
