import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="text-xl font-bold text-slate-900">BUSOS</span>
            <Link
              href="/sign-in"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-6" role="main">
          {children}
        </main>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <a
        href="#main"
        className="absolute -top-full left-4 z-50 rounded bg-slate-900 px-3 py-2 text-white transition-[top] focus:top-4 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <Suspense fallback={<div className="min-h-screen bg-zinc-950 p-6 text-zinc-400">Loading…</div>}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </div>
  );
}
