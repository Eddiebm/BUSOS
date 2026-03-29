"use client";

import Link from "next/link";
import { useVentureSummary } from "@/hooks/useVentureSummary";
import { cn } from "@/lib/utils";
import { getStageName } from "@/lib/stage-names";
import { AlertTriangle, Rocket, Focus, Shell } from "lucide-react";
import { AdaMessage } from "@/components/ada/AdaMessage";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { RunwayGauge } from "@/components/stress/RunwayGauge";
import { StageProgress } from "@/components/stages/StageProgress";
import { IntelligenceBanner } from "@/components/dashboard/IntelligenceBanner";
import { UpcomingMilestones } from "@/components/dashboard/UpcomingMilestones";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { StressMode } from "@/types/api";
import { useState } from "react";
import { toast } from "sonner";

interface DashboardProps {
  ventureId: string | null;
}

export function Dashboard({ ventureId }: DashboardProps) {
  const { venture, stress, loading, error, refresh } = useVentureSummary(ventureId);
  const mode = (venture?.stressMode ?? stress?.mode ?? "DISCOVERY") as StressMode;
  const stressLevel = venture?.stressLevel ?? stress?.stressLevel ?? 0;
  const [advancing, setAdvancing] = useState(false);

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="p-8">
        <ErrorState message={error.message} code={error.code} onRetry={refresh} />
      </div>
    );
  if (!venture)
    return (
      <div className="p-8">
        <EmptyState
          title="Select a venture"
          description="Choose a venture in the sidebar or create one under All ventures."
          actionLabel="Create venture"
          onAction={() => window.location.assign("/ventures")}
        />
      </div>
    );

  const completeStage = () => {
    if (!venture || advancing || venture.stage >= 13) return;
    setAdvancing(true);
    fetch(`/api/ventures/${venture.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: venture.stage + 1 }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Stage completed");
          refresh();
        } else toast.error("Could not advance stage");
      })
      .catch(() => toast.error("Could not advance stage"))
      .finally(() => setAdvancing(false));
  };

  const containerClasses = cn(
    "min-h-screen transition-colors duration-500",
    mode === "DISCOVERY" && "bg-gradient-to-br from-blue-50 to-indigo-50",
    mode === "EXECUTION" && "bg-gradient-to-br from-gray-50 to-slate-100",
    mode === "SURVIVAL" && "bg-gradient-to-br from-rose-50 to-orange-50 border-t-4 border-red-500"
  );

  const headerIcon = {
    DISCOVERY: <Rocket className="h-8 w-8 text-blue-600" aria-hidden />,
    EXECUTION: <Focus className="h-8 w-8 text-gray-700" aria-hidden />,
    SURVIVAL: <AlertTriangle className="h-8 w-8 animate-pulse text-red-600" aria-hidden />,
  };

  const stageTitle = getStageName(venture.stage);

  return (
    <div className={containerClasses}>
      <div className="px-6 pt-6">
        <IntelligenceBanner ventureId={venture.id} />
      </div>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b p-6">
        <div className="flex items-center gap-3">
          {headerIcon[mode]}
          <div>
            <h1 className="text-2xl font-bold">{venture.name}</h1>
            <p className="text-sm text-gray-600">Current stage: {stageTitle}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              mode === "DISCOVERY" && "bg-blue-100 text-blue-800",
              mode === "EXECUTION" && "bg-gray-200 text-gray-800",
              mode === "SURVIVAL" && "animate-pulse bg-red-100 text-red-800"
            )}
          >
            {mode} MODE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <RunwayGauge months={venture.cashRunwayMonths} />
          <div className="text-sm">Stress Level: {stressLevel}%</div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <AdaMessage ventureId={venture.id} mode={mode} />
          <AlertsPanel ventureId={venture.id} />

          {mode === "SURVIVAL" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="flex items-center gap-2 font-bold text-red-800">
                <Shell className="h-4 w-4" /> Emergency Kit
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                <li>
                  •{" "}
                  <Link
                    href={`/ventures/${venture.id}/emergency/bridge-financing`}
                    className="font-medium underline underline-offset-2 hover:text-red-900"
                  >
                    Bridge financing plan
                  </Link>
                </li>
                <li>
                  •{" "}
                  <Link
                    href={`/ventures/${venture.id}/emergency/pivot-canvas`}
                    className="font-medium underline underline-offset-2 hover:text-red-900"
                  >
                    Pivot canvas
                  </Link>
                </li>
                <li>
                  •{" "}
                  <Link
                    href={`/ventures/${venture.id}/emergency/cost-reduction`}
                    className="font-medium underline underline-offset-2 hover:text-red-900"
                  >
                    Cost reduction checklist
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {mode === "DISCOVERY" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-medium text-blue-800">Discovery Tip</h3>
              <p className="mt-1 text-sm text-blue-600">
                Complete customer interviews to validate your problem. We recommend 10-20 interviews.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <StageProgress currentStage={venture.stage} mode={mode} />

          {venture.stage < 13 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={completeStage}
                disabled={advancing}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {advancing ? "Updating…" : "Complete this stage"}
              </button>
            </div>
          )}

          <TaskList
            ventureId={venture.id}
            compact={mode === "SURVIVAL"}
            urgentOnly={mode === "SURVIVAL"}
          />

          {mode === "EXECUTION" && <UpcomingMilestones ventureId={venture.id} />}
        </div>
      </div>
    </div>
  );
}
