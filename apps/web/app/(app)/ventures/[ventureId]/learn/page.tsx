"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
};

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (category) sp.set("category", category);
      fetch(`/api/articles?${sp.toString()}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows) => setArticles(Array.isArray(rows) ? rows : []));
    }, 200);
    return () => window.clearTimeout(id);
  }, [q, category]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const a of articles) s.add(a.category);
    return [...s].sort();
  }, [articles]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-primary/90 hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Learn</h1>
        <p className="text-sm text-muted-foreground">Founder knowledge base — search and filter</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search articles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {articles.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => router.push(`/ventures/${ventureId}/learn/${a.slug}`)}
              className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition hover:border-primary/35"
            >
              <p className="font-medium text-foreground">{a.title}</p>
              <p className="text-xs text-primary/70">{a.category}</p>
            </button>
          </li>
        ))}
      </ul>
      {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles match.</p>}
    </div>
  );
}
