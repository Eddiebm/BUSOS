"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [venturesCount, setVenturesCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/ventures")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setVenturesCount(Array.isArray(d) ? d.length : 0))
      .catch(() => setVenturesCount(null));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
      <h1 className="text-4xl font-bold text-slate-900">BUSOS</h1>
      <p className="max-w-md text-slate-600">
        Entrepreneur Operating System — Ada AI co-founder, stress-adaptive dashboard, Blue Ocean
        intelligence, and Business Immune System.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {venturesCount === 0 && (
          <Link
            href="/onboarding"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Get started — create your first venture
          </Link>
        )}
        <Link
          href="/ventures"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          My ventures
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
