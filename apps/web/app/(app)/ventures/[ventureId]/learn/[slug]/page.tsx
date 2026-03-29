"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
};

function renderContent(content: string) {
  const lines = content.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      out.push(
        <h2 key={i} className="mt-8 text-xl font-semibold text-amber-100 first:mt-0">
          {line.slice(3)}
        </h2>
      );
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(
        <h1 key={i} className="mt-6 text-2xl font-bold text-zinc-50 first:mt-0">
          {line.slice(2)}
        </h1>
      );
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      out.push(
        <ul key={`ul-${i}`} className="my-3 list-disc space-y-1 pl-6 text-zinc-300">
          {items.map((t, j) => (
            <li key={j}>{t}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    out.push(
      <p key={i} className="my-3 leading-relaxed text-zinc-300">
        {line}
      </p>
    );
    i += 1;
  }
  return out;
}

export default function ArticlePage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => {
        if (a) setArticle(a as Article);
        else setErr(true);
      })
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href={`/ventures/${ventureId}/learn`} className="text-sm text-amber-500/90 hover:text-amber-400">
          ← Learn
        </Link>
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (err || !article) {
    return (
      <div className="space-y-4">
        <Link href={`/ventures/${ventureId}/learn`} className="text-sm text-amber-500/90 hover:text-amber-400">
          ← Learn
        </Link>
        <p className="text-zinc-400">Article not found.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href={`/ventures/${ventureId}/learn`} className="text-sm text-amber-500/90 hover:text-amber-400">
        ← Learn library
      </Link>
      <header>
        <p className="text-sm uppercase tracking-wide text-amber-200/80">{article.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-50">{article.title}</h1>
      </header>
      <div className="border-t border-zinc-800 pt-6">{renderContent(article.content)}</div>
    </article>
  );
}
