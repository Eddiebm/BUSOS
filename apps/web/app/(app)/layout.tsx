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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="text-xl font-bold text-foreground">BUSOS</span>
            <Link
              href="/sign-in"
              className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground"
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
      <div className="min-h-screen bg-background text-foreground">
        <a
        href="#main"
        className="absolute -top-full left-4 z-50 rounded bg-foreground px-3 py-2 text-background transition-[top] focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background"
      >
        Skip to main content
      </a>
      <Suspense fallback={<div className="min-h-screen bg-background p-6 text-muted-foreground">Loading…</div>}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </div>
  );
}
