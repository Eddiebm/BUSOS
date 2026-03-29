"use client";

import { useState, useEffect, useCallback } from "react";
import type { VentureSummaryResponse } from "@/types/api";

export function useVentureSummary(ventureId: string | null) {
  const [data, setData] = useState<VentureSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!ventureId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/summary`);
      const json = await res.json();
      if (!res.ok) {
        setError({ message: json.error ?? res.statusText, code: json.code });
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      setError({
        message: e instanceof Error ? e.message : "Failed to load",
        code: "NETWORK_ERROR",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    venture: data?.venture ?? null,
    stress: data?.stress ?? null,
    loading,
    error,
    refresh,
  };
}
