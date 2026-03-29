"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getStageName } from "@/lib/stage-names";
import type { StressMode } from "@/types/api";
import {
  Banknote,
  BookOpen,
  Brain,
  Briefcase,
  CircleDollarSign,
  LayoutGrid,
  Map,
  PieChart,
  Plug,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
} from "lucide-react";

interface VentureRow {
  id: string;
  name: string;
  stage?: number;
  stressLevel?: number;
  stressMode?: StressMode;
}

function resolveVentureId(pathname: string, searchParams: URLSearchParams): string | null {
  const m = pathname.match(/^\/ventures\/([^/]+)/);
  if (m) return m[1];
  return searchParams.get("ventureId");
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ventures, setVentures] = useState<VentureRow[]>([]);
  const [detail, setDetail] = useState<{
    stage: number;
    stressLevel: number;
    stressMode: StressMode;
  } | null>(null);

  const ventureId = resolveVentureId(pathname, searchParams);

  useEffect(() => {
    fetch("/api/ventures")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVentures(Array.isArray(data) ? data : []))
      .catch(() => setVentures([]));
  }, []);

  useEffect(() => {
    if (!ventureId) {
      setDetail(null);
      return;
    }
    fetch(`/api/ventures/${ventureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (v)
          setDetail({
            stage: v.stage ?? 1,
            stressLevel: v.stressLevel ?? 0,
            stressMode: v.stressMode ?? "DISCOVERY",
          });
        else setDetail(null);
      })
      .catch(() => setDetail(null));
  }, [ventureId]);

  const onVentureChange = useCallback(
    (newId: string) => {
      const m = pathname.match(/^\/ventures\/([^/]+)(\/.*)?$/);
      if (m) {
        const rest = m[2] ?? "";
        router.push(`/ventures/${newId}${rest}`);
      } else {
        router.push(`/dashboard?ventureId=${newId}`);
      }
      onNavigate?.();
    },
    [pathname, router, onNavigate]
  );

  const stage = detail?.stage ?? ventures.find((v) => v.id === ventureId)?.stage ?? 1;
  const stressMode = detail?.stressMode ?? "DISCOVERY";
  const stressLevel = detail?.stressLevel ?? 0;
  const stageLabel = getStageName(stage);

  const nav = (href: string, label: string, icon?: ReactNode) => {
    const pathOnly = href.split("?")[0];
    let active = false;
    if (pathOnly === "/dashboard") active = pathname === "/dashboard";
    else if (pathOnly.endsWith("/settings")) active = pathname === pathOnly;
    else active = pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);

    return (
      <Link
        href={href}
        onClick={() => onNavigate?.()}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-amber-500/15 text-amber-100" : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
        )}
      >
        {icon}
        {label}
      </Link>
    );
  };

  const base = ventureId ? `/ventures/${ventureId}` : "/dashboard";

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-zinc-100"
          onClick={() => onNavigate?.()}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-xs font-bold text-amber-200">
            B
          </span>
          <span className="text-lg text-amber-50">BUSOS</span>
        </Link>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label htmlFor="venture-switcher" className="mb-1 block text-xs font-medium uppercase text-zinc-500">
            Venture
          </label>
          <select
            id="venture-switcher"
            value={ventureId ?? ""}
            onChange={(e) => e.target.value && onVentureChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Select venture…</option>
            {ventures.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {ventureId && (
          <>
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Stage</p>
              <p className="text-sm font-medium text-zinc-100">{stageLabel}</p>
              <p className="mb-2 text-xs text-zinc-500">
                Stage {stage} of 13
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-500/80 transition-all"
                  style={{ width: `${(stage / 13) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
                  stressMode === "DISCOVERY" && "bg-blue-500/20 text-blue-200",
                  stressMode === "EXECUTION" && "bg-zinc-700 text-zinc-200",
                  stressMode === "SURVIVAL" && "bg-red-500/20 text-red-200"
                )}
              >
                {stressMode}
              </span>
              <span className="text-sm text-zinc-500">Stress {stressLevel}%</span>
            </div>
          </>
        )}

        <nav className="space-y-1 border-t border-zinc-800 pt-4" aria-label="Main">
          {nav("/dashboard" + (ventureId ? `?ventureId=${ventureId}` : ""), "Dashboard")}
          {ventureId ? (
            <>
              {nav(`${base}/dream`, "Dream", <Sparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(`${base}/journey`, "Journey", <Map className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(
                `${base}/blue-ocean`,
                "Blue Ocean",
                <Waves className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
              {nav(
                `${base}/lean-canvas`,
                "Lean Canvas",
                <LayoutGrid className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
              {nav(
                `${base}/financials`,
                "Financials",
                <CircleDollarSign className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
              {nav(`${base}/crm`, "CRM", <Users className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(`${base}/captable`, "Cap table", <PieChart className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(
                `${base}/investors`,
                "Investors",
                <Briefcase className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
              {nav(
                `${base}/growth`,
                "Growth",
                <TrendingUp className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
              {nav(`${base}/learn`, "Learn", <BookOpen className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(
                `${base}/funding`,
                "Funding",
                <Banknote className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
              {nav(`${base}/tasks`, "Roadmap")}
              {nav(`${base}/documents`, "Documents")}
              {nav(`${base}/intelligence`, "Intelligence", <Brain className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(`${base}/settings`, "Settings")}
              {nav(`${base}/settings/team`, "Team", <Users className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(`${base}/settings/integrations`, "Integrations", <Plug className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
            </>
          ) : (
            <>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Dream</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Journey</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Blue Ocean</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Lean Canvas</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Financials</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">CRM</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Cap table</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Investors</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Growth</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Learn</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Funding</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Roadmap</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Documents</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Intelligence</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Settings</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Team</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600">Integrations</span>
            </>
          )}
          <Link
            href="/ventures"
            onClick={() => onNavigate?.()}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            All ventures
          </Link>
        </nav>
      </div>

      <div className="border-t border-zinc-800 p-4">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
