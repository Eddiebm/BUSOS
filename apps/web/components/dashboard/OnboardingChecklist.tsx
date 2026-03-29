"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

type Status = {
  hasDna: boolean;
  hasMilestones: boolean;
  hasTeam: boolean;
  hasIntegration: boolean;
  openMilestones: number;
};

export function OnboardingChecklist({ ventureId }: { ventureId: string }) {
  const [s, setS] = useState<Status | null>(null);

  useEffect(() => {
    fetch(`/api/ventures/${ventureId}/onboarding`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setS);
  }, [ventureId]);

  if (!s) return null;

  const items: { ok: boolean; label: string; href: string }[] = [
    { ok: s.hasDna, label: "Complete Venture DNA (intake)", href: `/ventures/${ventureId}/dream` },
    { ok: s.hasMilestones, label: "Generate or add journey milestones", href: `/ventures/${ventureId}/journey` },
    { ok: s.hasTeam, label: "Invite a teammate", href: `/ventures/${ventureId}/settings/team` },
    { ok: s.hasIntegration, label: "Connect Slack, GitHub, or Calendar", href: `/ventures/${ventureId}/settings/integrations` },
  ];

  const done = items.filter((i) => i.ok).length;
  if (done === items.length) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-zinc-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Getting started</p>
      <p className="mt-1 text-sm text-zinc-400">
        {done}/{items.length} complete — finish these to get the most from BUSOS.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="flex items-start gap-2 text-sm text-zinc-200 hover:text-amber-100"
            >
              {it.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
              )}
              <span className={it.ok ? "line-through opacity-60" : ""}>{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      {s.openMilestones > 0 && (
        <p className="mt-3 text-xs text-zinc-500">
          You have {s.openMilestones} open roadmap step{s.openMilestones === 1 ? "" : "s"} —{" "}
          <Link href={`/ventures/${ventureId}/tasks`} className="text-amber-400/90 hover:text-amber-300">
            focus your roadmap
          </Link>
        </p>
      )}
    </div>
  );
}
