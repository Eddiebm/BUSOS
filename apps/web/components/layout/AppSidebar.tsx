"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getStageName } from "@/lib/stage-names";
import type { StressMode } from "@/types/api";
import { Map, Sparkles } from "lucide-react";

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
    else active = pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);

    return (
      <Link
        href={href}
        onClick={() => onNavigate?.()}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        {icon}
        {label}
      </Link>
    );
  };

  const base = ventureId ? `/ventures/${ventureId}` : "/dashboard";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900" onClick={() => onNavigate?.()}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            B
          </span>
          <span className="text-lg">BUSOS</span>
        </Link>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label htmlFor="venture-switcher" className="mb-1 block text-xs font-medium uppercase text-slate-500">
            Venture
          </label>
          <select
            id="venture-switcher"
            value={ventureId ?? ""}
            onChange={(e) => e.target.value && onVentureChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
              <p className="mb-1 text-xs font-medium uppercase text-slate-500">Stage</p>
              <p className="text-sm font-medium text-slate-900">{stageLabel}</p>
              <p className="mb-2 text-xs text-slate-600">
                Stage {stage} of 13
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${(stage / 13) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
                  stressMode === "DISCOVERY" && "bg-blue-100 text-blue-800",
                  stressMode === "EXECUTION" && "bg-slate-200 text-slate-800",
                  stressMode === "SURVIVAL" && "bg-red-100 text-red-800"
                )}
              >
                {stressMode}
              </span>
              <span className="text-sm text-slate-600">Stress {stressLevel}%</span>
            </div>
          </>
        )}

        <nav className="space-y-1 border-t border-slate-100 pt-4" aria-label="Main">
          {nav("/dashboard" + (ventureId ? `?ventureId=${ventureId}` : ""), "Dashboard")}
          {ventureId ? (
            <>
              {nav(`${base}/dream`, "Dream", <Sparkles className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(`${base}/journey`, "Journey", <Map className="h-4 w-4 shrink-0 opacity-90" aria-hidden />)}
              {nav(`${base}/tasks`, "Tasks")}
              {nav(`${base}/documents`, "Documents")}
              {nav(`${base}/settings`, "Settings")}
            </>
          ) : (
            <>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-400">Dream</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-400">Journey</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-400">Tasks</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-400">Documents</span>
              <span className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-slate-400">Settings</span>
            </>
          )}
          <Link
            href="/ventures"
            onClick={() => onNavigate?.()}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            All ventures
          </Link>
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
