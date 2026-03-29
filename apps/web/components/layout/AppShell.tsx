"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    }).catch(() => {});
    const ping = () => fetch("/api/session/activity", { method: "POST" }).catch(() => {});
    ping();
    const id = window.setInterval(ping, 120_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:z-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-hidden={!open}
      >
        <AppSidebar onNavigate={() => setOpen(false)} />
      </aside>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-overlay/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="app-sidebar"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </button>
          <Link href="/" className="font-bold text-primary">
            BUSOS
          </Link>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 text-foreground" id="main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
