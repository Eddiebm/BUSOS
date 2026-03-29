"use client";

import { useState, useEffect, useCallback } from "react";

export type StressMode = "DISCOVERY" | "EXECUTION" | "SURVIVAL";

export interface Venture {
  id: string;
  name: string;
  description?: string | null;
  stage: number;
  stressLevel: number;
  stressMode: StressMode;
  cashRunwayMonths?: number | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

export function useVenture(ventureId?: string | null) {
  const [venture, setVenture] = useState<Venture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!ventureId) {
      setVenture(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setVenture(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setVenture(null);
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { venture, loading, error, refresh };
}
