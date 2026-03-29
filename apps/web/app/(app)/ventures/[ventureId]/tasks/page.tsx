"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { TaskList } from "@/components/tasks/TaskList";

export default function VentureTasksPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-slate-600 hover:text-slate-900">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <TaskList ventureId={ventureId} compact={false} urgentOnly={false} />
      </div>
    </div>
  );
}
