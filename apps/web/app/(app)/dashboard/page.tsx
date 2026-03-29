"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Dashboard } from "@/components/stress-ui/Dashboard";

interface VentureSummary {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const ventureIdFromUrl = searchParams.get("ventureId");
  const [ventures, setVentures] = useState<VentureSummary[]>([]);
  const [ventureId, setVentureId] = useState<string | null>(ventureIdFromUrl);

  useEffect(() => {
    setVentureId(ventureIdFromUrl);
  }, [ventureIdFromUrl]);

  useEffect(() => {
    fetch("/api/ventures")
      .then((r) => r.ok && r.json())
      .then((data) => data && setVentures(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <span className="text-sm text-slate-600">Venture:</span>
        <select
          value={ventureId ?? ""}
          onChange={(e) => setVentureId(e.target.value || null)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Select…</option>
          {ventures.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <Link
          href="/ventures"
          className="text-sm text-slate-500 underline hover:text-slate-700"
        >
          Manage ventures
        </Link>
      </div>
      <Dashboard ventureId={ventureId} />
    </div>
  );
}
