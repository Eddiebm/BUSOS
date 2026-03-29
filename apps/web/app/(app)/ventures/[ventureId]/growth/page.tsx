"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatUserDateTime } from "@/lib/datetime";
import { toast } from "sonner";
import type { ContentChannel, ContentStatus } from "@prisma/client";

type ContentPiece = {
  id: string;
  title: string;
  status: ContentStatus;
  channel: ContentChannel;
  publishAt: string | null;
  updatedAt: string;
};

type Keyword = {
  id: string;
  term: string;
  volume: number | null;
  difficulty: number | null;
};

export default function GrowthPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [viewerTz, setViewerTz] = useState<string | null>(null);
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [pieceForm, setPieceForm] = useState({
    title: "",
    status: "DRAFT" as ContentStatus,
    channel: "BLOG" as ContentChannel,
    publishAt: "",
  });
  const [kwForm, setKwForm] = useState({ term: "", volume: "", difficulty: "" });

  const load = useCallback(() => {
    fetch(`/api/user/profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setViewerTz(p?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone))
      .catch(() => setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone));

    fetch(`/api/ventures/${ventureId}/content-pieces`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setPieces(Array.isArray(rows) ? rows : []));
    fetch(`/api/ventures/${ventureId}/keywords`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setKeywords(Array.isArray(rows) ? rows : []));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  const addPiece = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/ventures/${ventureId}/content-pieces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pieceForm.title,
        status: pieceForm.status,
        channel: pieceForm.channel,
        publishAt: pieceForm.publishAt || null,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Content piece added");
          setPieceForm({
            title: "",
            status: "DRAFT",
            channel: "BLOG",
            publishAt: "",
          });
          load();
        } else toast.error("Could not add");
      })
      .catch(() => toast.error("Could not add"));
  };

  const patchPiece = (id: string, patch: Partial<ContentPiece>) => {
    fetch(`/api/ventures/${ventureId}/content-pieces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
      .then((r) => {
        if (r.ok) load();
        else toast.error("Could not update");
      })
      .catch(() => toast.error("Could not update"));
  };

  const deletePiece = (id: string) => {
    if (!confirm("Delete this item?")) return;
    fetch(`/api/ventures/${ventureId}/content-pieces/${id}`, { method: "DELETE" }).then((r) => {
      if (r.ok) {
        toast.success("Deleted");
        load();
      } else toast.error("Could not delete");
    });
  };

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/ventures/${ventureId}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term: kwForm.term,
        volume: kwForm.volume === "" ? null : Number(kwForm.volume),
        difficulty: kwForm.difficulty === "" ? null : Number(kwForm.difficulty),
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Keyword added");
          setKwForm({ term: "", volume: "", difficulty: "" });
          load();
        } else toast.error("Could not add");
      })
      .catch(() => toast.error("Could not add"));
  };

  const deleteKeyword = (id: string) => {
    fetch(`/api/ventures/${ventureId}/keywords/${id}`, { method: "DELETE" }).then((r) => {
      if (r.ok) {
        toast.success("Removed");
        load();
      } else toast.error("Could not remove");
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-primary/90 hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Growth</h1>
        <p className="text-sm text-muted-foreground">Content calendar and SEO keywords</p>
      </div>

      <section className="rounded-xl border border-primary/15 bg-card/60 p-6">
        <h2 className="text-lg font-semibold text-foreground">Content calendar</h2>
        <form onSubmit={addPiece} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            placeholder="Title"
            value={pieceForm.title}
            onChange={(e) => setPieceForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
            required
          />
          <select
            value={pieceForm.status}
            onChange={(e) => setPieceForm((f) => ({ ...f, status: e.target.value as ContentStatus }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <select
            value={pieceForm.channel}
            onChange={(e) => setPieceForm((f) => ({ ...f, channel: e.target.value as ContentChannel }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="BLOG">Blog</option>
            <option value="TWITTER">Twitter</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>
          <input
            type="datetime-local"
            value={pieceForm.publishAt}
            onChange={(e) => setPieceForm((f) => ({ ...f, publishAt: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-2 lg:col-span-1"
          >
            Add
          </button>
        </form>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pieces.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-background/80 p-4">
              <p className="font-medium text-foreground">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {p.channel} · {p.status}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.publishAt
                  ? viewerTz
                    ? formatUserDateTime(p.publishAt, viewerTz)
                    : new Date(p.publishAt).toLocaleString()
                  : "No publish date"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    patchPiece(p.id, { status: p.status === "DRAFT" ? "PUBLISHED" : "DRAFT" })
                  }
                  className="text-xs text-primary hover:text-primary"
                >
                  Toggle publish
                </button>
                <button
                  type="button"
                  onClick={() => deletePiece(p.id)}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {pieces.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No content scheduled.</p>}
      </section>

      <section className="rounded-xl border border-primary/15 bg-card/60 p-6">
        <h2 className="text-lg font-semibold text-foreground">SEO keywords</h2>
        <form onSubmit={addKeyword} className="mt-4 flex flex-wrap gap-2">
          <input
            placeholder="Keyword"
            value={kwForm.term}
            onChange={(e) => setKwForm((f) => ({ ...f, term: e.target.value }))}
            className="min-w-[160px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Volume"
            type="number"
            min={0}
            value={kwForm.volume}
            onChange={(e) => setKwForm((f) => ({ ...f, volume: e.target.value }))}
            className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="Difficulty 0–100"
            type="number"
            min={0}
            max={100}
            value={kwForm.difficulty}
            onChange={(e) => setKwForm((f) => ({ ...f, difficulty: e.target.value }))}
            className="w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Add keyword
          </button>
        </form>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-4">Term</th>
                <th className="pb-2 pr-4">Volume</th>
                <th className="pb-2 pr-4">Difficulty</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {keywords.map((k) => (
                <tr key={k.id} className="border-b border-border/80 text-muted-foreground">
                  <td className="py-2 pr-4">{k.term}</td>
                  <td className="py-2 pr-4">{k.volume ?? "—"}</td>
                  <td className="py-2 pr-4">{k.difficulty ?? "—"}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteKeyword(k.id)}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {keywords.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No keywords tracked.</p>}
        </div>
      </section>
    </div>
  );
}
