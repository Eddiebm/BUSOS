"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { Calendar, Github, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { IntegrationProvider } from "@prisma/client";

type Row = { provider: IntegrationProvider; connected: boolean; metadata: unknown };

const CARDS: { provider: IntegrationProvider; title: string; body: string; icon: ReactNode }[] = [
  {
    provider: "SLACK",
    title: "Slack",
    body: "OAuth: workspace token for notifications (configure SLACK_CLIENT_ID in production).",
    icon: <MessageSquare className="h-6 w-6 text-primary" aria-hidden />,
  },
  {
    provider: "GITHUB",
    title: "GitHub",
    body: "OAuth: link repos and issues (configure GITHUB_CLIENT_ID).",
    icon: <Github className="h-6 w-6 text-primary" aria-hidden />,
  },
  {
    provider: "GOOGLE_CALENDAR",
    title: "Google Calendar",
    body: "OAuth: sync milestone due dates (configure GOOGLE_CLIENT_ID).",
    icon: <Calendar className="h-6 w-6 text-primary" aria-hidden />,
  },
];

function IntegrationsPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ventureId = params.ventureId as string;
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<IntegrationProvider | null>(null);

  const load = useCallback(() => {
    fetch(`/api/ventures/${ventureId}/integrations`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.providers) setRows(d.providers as Row[]);
        else setRows([]);
      })
      .catch(() => setRows([]));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const p = searchParams.get("p");
    if (oauth === "success") {
      toast.success(p ? `Connected: ${p}` : "Integration connected");
      load();
    } else if (oauth && oauth !== "success") {
      toast.message(`OAuth: ${oauth.replace(/_/g, " ")}`);
    }
  }, [searchParams, load]);

  const startOAuth = (provider: IntegrationProvider) => {
    window.location.assign(
      `/api/ventures/${ventureId}/integrations/oauth/start?provider=${encodeURIComponent(provider)}`
    );
  };

  const connectStub = (provider: IntegrationProvider) => {
    setBusy(provider);
    fetch(`/api/ventures/${ventureId}/integrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Demo connected (no OAuth)");
          load();
        } else if (r.status === 403) toast.error("Admin or owner required");
        else toast.error("Could not connect");
      })
      .catch(() => toast.error("Could not connect"))
      .finally(() => setBusy(null));
  };

  const status = (p: IntegrationProvider) => rows.find((r) => r.provider === p)?.connected ?? false;
  const meta = (p: IntegrationProvider) => rows.find((r) => r.provider === p)?.metadata as { stub?: boolean } | null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href={`/ventures/${ventureId}/settings`}
          className="text-sm text-primary/90 hover:text-primary"
        >
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Use OAuth when client IDs are set; otherwise use demo connect for testing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        {CARDS.map((c) => (
          <div
            key={c.provider}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/15 bg-card/60 p-5"
          >
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">{c.icon}</div>
              <div>
                <h2 className="font-semibold text-foreground">{c.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                {status(c.provider) && (
                  <p className="mt-2 text-xs text-success/90">
                    Connected{meta(c.provider)?.stub ? " (demo)" : " (OAuth)"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => startOAuth(c.provider)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary disabled:opacity-50"
              >
                {busy === c.provider ? "…" : status(c.provider) ? "Reconnect (OAuth)" : "Connect (OAuth)"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => connectStub(c.provider)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Demo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <IntegrationsPageInner />
    </Suspense>
  );
}
