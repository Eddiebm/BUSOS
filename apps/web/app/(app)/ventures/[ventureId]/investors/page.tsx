"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { INVESTOR_STAGES } from "@/lib/crm-stages";
import { formatUserDateTime } from "@/lib/datetime";
import { toast } from "sonner";
import type { CrmInteractionType } from "@prisma/client";

type Contact = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
};

type Deal = {
  id: string;
  name: string;
  value: number;
  stage: string;
  contactId: string | null;
  contact: Contact | null;
  interactions: { id: string; date: string; type: string; notes: string }[];
};

type InvestorUpdate = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const STAGE_LABEL: Record<string, string> = {
  RESEARCHED: "Researched",
  CONTACTED: "Contacted",
  PITCHED: "Pitched",
  DUE_DILIGENCE: "Due diligence",
  COMMITTED: "Committed",
  LOST: "Lost",
};

export default function InvestorsPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [viewerTz, setViewerTz] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [dealForm, setDealForm] = useState({ name: "", value: "", contactId: "", stage: "RESEARCHED" });
  const [updateForm, setUpdateForm] = useState({ title: "", body: "", adaAssist: false });
  const [interactionForm, setInteractionForm] = useState({
    type: "MEETING" as CrmInteractionType,
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(() => {
    fetch(`/api/user/profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setViewerTz(p?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone))
      .catch(() => setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone));

    fetch(`/api/ventures/${ventureId}/deals?kind=INVESTOR`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setDeals(Array.isArray(rows) ? rows : []));
    fetch(`/api/ventures/${ventureId}/contacts`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setContacts(Array.isArray(rows) ? rows : []));
    fetch(`/api/ventures/${ventureId}/investor-updates`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setUpdates(Array.isArray(rows) ? rows : []));
  }, [ventureId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetailDeal(null);
      return;
    }
    fetch(`/api/ventures/${ventureId}/deals/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDetailDeal(d as Deal | null))
      .catch(() => setDetailDeal(null));
  }, [selectedId, ventureId]);

  const selected = detailDeal ?? deals.find((d) => d.id === selectedId) ?? null;

  const moveStage = (dealId: string, stage: string) => {
    fetch(`/api/ventures/${ventureId}/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    })
      .then((r) => {
        if (r.ok) load();
        else toast.error("Could not update");
      })
      .catch(() => toast.error("Could not update"));
  };

  const onDropColumn = (stage: string) => {
    if (!dragId) return;
    moveStage(dragId, stage);
    setDragId(null);
  };

  const addDeal = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/ventures/${ventureId}/deals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: dealForm.name,
        value: Number(dealForm.value) || 0,
        kind: "INVESTOR",
        stage: dealForm.stage,
        contactId: dealForm.contactId || null,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Investor deal created");
          setDealForm({ name: "", value: "", contactId: "", stage: "RESEARCHED" });
          load();
        } else toast.error("Could not create");
      })
      .catch(() => toast.error("Could not create"));
  };

  const submitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/ventures/${ventureId}/investor-updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: updateForm.title,
        body: updateForm.body,
        adaAssist: updateForm.adaAssist,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Update saved");
          setUpdateForm({ title: "", body: "", adaAssist: false });
          load();
        } else toast.error("Could not save update");
      })
      .catch(() => toast.error("Could not save update"));
  };

  const addInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    fetch(`/api/ventures/${ventureId}/deals/${selectedId}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: interactionForm.type,
        notes: interactionForm.notes,
        date: interactionForm.date,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Logged");
          setInteractionForm((f) => ({ ...f, notes: "" }));
          load();
          if (selectedId)
            fetch(`/api/ventures/${ventureId}/deals/${selectedId}`)
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((d) => setDetailDeal(d as Deal | null));
        } else toast.error("Could not log");
      })
      .catch(() => toast.error("Could not log"));
  };

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-primary/90 hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Investor relations</h1>
        <p className="text-sm text-muted-foreground">Fundraising pipeline and investor updates</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Pipeline</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {INVESTOR_STAGES.map((stage) => (
            <div
              key={stage}
              className="min-w-[200px] flex-1 rounded-xl border border-border bg-card/50 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropColumn(stage)}
            >
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {STAGE_LABEL[stage] ?? stage}
              </p>
              <div className="space-y-2">
                {deals
                  .filter((d) => d.stage === stage)
                  .map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      draggable
                      onDragStart={() => setDragId(d.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setSelectedId(d.id)}
                      className="w-full rounded-lg border border-border/80 bg-background p-3 text-left text-sm hover:border-primary/45"
                    >
                      <p className="font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(d.value)}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={addDeal} className="rounded-xl border border-primary/15 bg-card/60 p-4 space-y-3">
        <h2 className="font-semibold text-foreground">New investor deal</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            placeholder="Name"
            value={dealForm.name}
            onChange={(e) => setDealForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Round size / commitment ($)"
            type="number"
            min={0}
            value={dealForm.value}
            onChange={(e) => setDealForm((f) => ({ ...f, value: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={dealForm.stage}
            onChange={(e) => setDealForm((f) => ({ ...f, stage: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {INVESTOR_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s] ?? s}
              </option>
            ))}
          </select>
          <select
            value={dealForm.contactId}
            onChange={(e) => setDealForm((f) => ({ ...f, contactId: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Contact (optional)</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Add deal
        </button>
      </form>

      {selected && (
        <div className="rounded-xl border border-primary/30 bg-card/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{selected.name}</h2>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(selected.value)} ·{" "}
                {STAGE_LABEL[selected.stage] ?? selected.stage}
              </p>
              {selected.contact && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selected.contact.name} ({selected.contact.email})
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-sm text-muted-foreground hover:text-muted-foreground"
            >
              Close
            </button>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-primary">Interactions</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {(selected.interactions ?? []).map((i) => (
                <li key={i.id} className="border-b border-border/60 pb-2">
                  {i.type} · {viewerTz ? formatUserDateTime(i.date, viewerTz) : i.date}
                  <p className="mt-1 whitespace-pre-wrap">{i.notes}</p>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={addInteraction} className="mt-4 grid gap-2 sm:grid-cols-4">
            <select
              value={interactionForm.type}
              onChange={(e) =>
                setInteractionForm((f) => ({ ...f, type: e.target.value as CrmInteractionType }))
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="EMAIL">Email</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
            </select>
            <input
              type="date"
              value={interactionForm.date}
              onChange={(e) => setInteractionForm((f) => ({ ...f, date: e.target.value }))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder="Notes"
              value={interactionForm.notes}
              onChange={(e) => setInteractionForm((f) => ({ ...f, notes: e.target.value }))}
              className="sm:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-4"
            >
              Log interaction
            </button>
          </form>
        </div>
      )}

      <section className="rounded-xl border border-primary/15 bg-card/60 p-6">
        <h2 className="text-lg font-semibold text-foreground">Investor update</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rich text saved as markdown. Enable Ada assist to structure into Highlights, Metrics, Challenges, Ask (requires{" "}
          <code className="text-primary">OPENAI_API_KEY</code>).
        </p>
        <form onSubmit={submitUpdate} className="mt-4 space-y-3">
          <input
            placeholder="Title"
            value={updateForm.title}
            onChange={(e) => setUpdateForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <textarea
            placeholder="Write your update…"
            value={updateForm.body}
            onChange={(e) => setUpdateForm((f) => ({ ...f, body: e.target.value }))}
            rows={10}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
            required
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={updateForm.adaAssist}
              onChange={(e) => setUpdateForm((f) => ({ ...f, adaAssist: e.target.checked }))}
            />
            Ada assist (restructure draft)
          </label>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Save update
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Past updates</h2>
        <ul className="space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="rounded-lg border border-border bg-background/60 p-4">
              <p className="font-medium text-foreground">{u.title}</p>
              <p className="text-xs text-muted-foreground">
                {viewerTz ? formatUserDateTime(u.createdAt, viewerTz) : u.createdAt}
              </p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">{u.body}</pre>
            </li>
          ))}
          {updates.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
        </ul>
      </section>
    </div>
  );
}
