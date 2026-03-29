"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface DocRow {
  id: string;
  title: string;
  type: string;
  isAIGenerated: boolean;
  createdAt: string;
}

interface DocDetail extends DocRow {
  content: string | null;
}

const GENERATE_OPTIONS = [
  { label: "Business Plan", value: "BUSINESS_PLAN" },
  { label: "Market Report", value: "MARKET_REPORT" },
  { label: "Value Proposition", value: "VALUE_PROPOSITION" },
  { label: "Pitch Deck", value: "SALES_PITCH" },
] as const;

export default function VentureDocumentsPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [list, setList] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [genType, setGenType] = useState<string>("BUSINESS_PLAN");
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocDetail | null>(null);

  const loadList = useCallback(() => {
    if (!ventureId) return;
    setLoading(true);
    fetch(`/api/ventures/${ventureId}/documents`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [ventureId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDoc = (id: string) => {
    setSelectedId(id);
    fetch(`/api/ventures/${ventureId}/documents/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setDetail)
      .catch(() => setDetail(null));
  };

  const generate = () => {
    if (!ventureId || generating) return;
    setGenerating(true);
    fetch(`/api/ventures/${ventureId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: genType }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          toast.success("Document generated");
          setModalOpen(false);
          loadList();
          if (data?.id) openDoc(data.id);
        } else {
          toast.error(data?.error ?? "Generation failed");
        }
      })
      .catch(() => toast.error("Generation failed"))
      .finally(() => setGenerating(false));
  };

  const download = () => {
    if (!detail?.content) return;
    const blob = new Blob([detail.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${detail.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard?ventureId=${ventureId}`} className="text-slate-600 hover:text-slate-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Library</h2>
          {loading ? (
            <p className="mt-2 text-sm text-slate-600">Loading…</p>
          ) : list.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No documents yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {list.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => openDoc(d.id)}
                    className={`flex w-full flex-col items-start py-3 text-left text-sm hover:bg-slate-50 ${
                      selectedId === d.id ? "bg-slate-50" : ""
                    }`}
                  >
                    <span className="font-medium text-slate-900">{d.title}</span>
                    <span className="text-xs text-slate-500">
                      {d.type.replace(/_/g, " ")}
                      {d.isAIGenerated ? " · AI" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Preview</h2>
            {detail?.content && (
              <button
                type="button"
                onClick={download}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Download
              </button>
            )}
          </div>
          {!detail ? (
            <p className="mt-4 text-sm text-slate-600">Select a document to read.</p>
          ) : (
            <article className="mt-4 max-h-[70vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
              {detail.content ?? "No text content."}
            </article>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Generate document</h3>
            <label htmlFor="doc-type" className="mt-4 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="doc-type"
              value={genType}
              onChange={(e) => setGenType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {GENERATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={generate}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {generating ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
