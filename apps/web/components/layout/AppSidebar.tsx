"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getStageName } from "@/lib/stage-names";
import type { StressMode } from "@/types/api";
import {
  Banknote,
  BookOpen,
  Brain,
  Briefcase,
  Camera,
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
          active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
      >
        {icon}
        {label}
      </Link>
    );
  };

  const base = ventureId ? `/ventures/${ventureId}` : "/dashboard";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-sidebar-foreground"
          onClick={() => onNavigate?.()}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
            B
          </span>
          <span className="text-lg text-primary">BUSOS</span>
        </Link>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label htmlFor="venture-switcher" className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
            Venture
          </label>
          <select
            id="venture-switcher"
            value={ventureId ?? ""}
            onChange={(e) => e.target.value && onVentureChange(e.target.value)}
            className="w-full rounded-lg border border-sidebar-border bg-background px-3 py-2 text-sm text-foreground"
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
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Stage</p>
              <p className="text-sm font-medium text-foreground">{stageLabel}</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Stage {stage} of 13
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all"
                  style={{ width: `${(stage / 13) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
                  stressMode === "DISCOVERY" && "bg-info/100/20 text-info",
                  stressMode === "EXECUTION" && "bg-muted text-foreground",
                  stressMode === "SURVIVAL" && "bg-destructive/100/20 text-destructive-foreground"
                )}
              >
                {stressMode}
              </span>
              <span className="text-sm text-muted-foreground">Stress {stressLevel}%</span>
            </div>
          </>
        )}

        <nav className="space-y-1 border-t border-sidebar-border pt-4" aria-label="Main">
          {nav("/dashboard" + (ventureId ? `?ventureId=${ventureId}` : ""), "Dashboard")}
          {ventureId ? (
            <>
              {nav(
                `${base}/snapshot`,
                "Snapshot",
                <Camera className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              )}
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
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">
                Snapshot
              </span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Dream</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Journey</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Blue Ocean</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Lean Canvas</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Financials</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">CRM</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Cap table</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Investors</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Growth</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Learn</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Funding</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Roadmap</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Documents</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Intelligence</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Settings</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Team</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted-foreground">Integrations</span>
            </>
          )}
          <Link
            href="/ventures"
            onClick={() => onNavigate?.()}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            All ventures
          </Link>
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Appearance
          </span>
          <ThemeToggle />
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
