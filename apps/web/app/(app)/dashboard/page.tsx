"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Dashboard } from "@/components/stress-ui/Dashboard";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const ventureIdFromUrl = searchParams.get("ventureId");
  const [ventureId, setVentureId] = useState<string | null>(ventureIdFromUrl);

  useEffect(() => {
    setVentureId(ventureIdFromUrl);
  }, [ventureIdFromUrl]);

  return <Dashboard ventureId={ventureId} />;
}
