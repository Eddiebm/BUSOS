"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SALES_STAGES } from "@/lib/crm-stages";
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

const STAGE_LABEL: Record<string, string> = {
  LEAD: "Lead",
  CONTACTED: "Contacted",
  DEMO: "Demo",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export default function CrmPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const [viewerTz, setViewerTz] = useState<string | null>(null);
  const [tab, setTab] = useState<"board" | "contacts">("board");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", role: "" });
  const [dealForm, setDealForm] = useState({ name: "", value: "", contactId: "" });
  const [interactionForm, setInteractionForm] = useState({
    type: "EMAIL" as CrmInteractionType,
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(() => {
    fetch(`/api/user/profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setViewerTz(p?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone))
      .catch(() => setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone));

    fetch(`/api/ventures/${ventureId}/deals?kind=SALES`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setDeals(Array.isArray(rows) ? rows : []));
    fetch(`/api/ventures/${ventureId}/contacts`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setContacts(Array.isArray(rows) ? rows : []));
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
        else toast.error("Could not update deal");
      })
      .catch(() => toast.error("Could not update deal"));
  };

  const onDropColumn = (stage: string) => {
    if (!dragId) return;
    moveStage(dragId, stage);
    setDragId(null);
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/ventures/${ventureId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contactForm.name,
        email: contactForm.email,
        company: contactForm.company || undefined,
        role: contactForm.role || undefined,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Contact added");
          setContactForm({ name: "", email: "", company: "", role: "" });
          load();
        } else toast.error("Could not add contact");
      })
      .catch(() => toast.error("Could not add contact"));
  };

  const addDeal = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/ventures/${ventureId}/deals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: dealForm.name,
        value: Number(dealForm.value) || 0,
        kind: "SALES",
        stage: "LEAD",
        contactId: dealForm.contactId || null,
      }),
    })
      .then((r) => {
        if (r.ok) {
          toast.success("Deal created");
          setDealForm({ name: "", value: "", contactId: "" });
          load();
        } else toast.error("Could not create deal");
      })
      .catch(() => toast.error("Could not create deal"));
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
        } else toast.error("Could not log interaction");
      })
      .catch(() => toast.error("Could not log interaction"));
  };

  const deleteContact = (id: string) => {
    if (!confirm("Delete this contact?")) return;
    fetch(`/api/ventures/${ventureId}/contacts/${id}`, { method: "DELETE" }).then((r) => {
      if (r.ok) {
        toast.success("Deleted");
        load();
      } else toast.error("Could not delete");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard?ventureId=${ventureId}`} className="text-sm text-amber-500/90 hover:text-amber-400">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-50">CRM</h1>
        <p className="text-sm text-zinc-400">Sales pipeline and contacts</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setTab("board")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "board" ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Kanban
        </button>
        <button
          type="button"
          onClick={() => setTab("contacts")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "contacts" ? "bg-amber-500/20 text-amber-100" : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Contacts
        </button>
      </div>

      {tab === "board" && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {SALES_STAGES.map((stage) => (
            <div
              key={stage}
              className="min-w-[220px] flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropColumn(stage)}
            >
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                      className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 p-3 text-left text-sm hover:border-amber-500/40"
                    >
                      <p className="font-medium text-zinc-100">{d.name}</p>
                      <p className="text-xs text-zinc-500">
                        {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(d.value)}
                      </p>
                      {d.contact && <p className="mt-1 text-xs text-amber-200/70">{d.contact.name}</p>}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "contacts" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Company</th>
                <th className="p-3">Role</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/80 text-zinc-300">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.company ?? "—"}</td>
                  <td className="p-3">{c.role ?? "—"}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteContact(c.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={addContact} className="rounded-xl border border-amber-500/15 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="font-semibold text-zinc-100">New contact</h2>
          <input
            placeholder="Name"
            value={contactForm.name}
            onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Company"
            value={contactForm.company}
            onChange={(e) => setContactForm((f) => ({ ...f, company: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <input
            placeholder="Role"
            value={contactForm.role}
            onChange={(e) => setContactForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950"
          >
            Add contact
          </button>
        </form>

        <form onSubmit={addDeal} className="rounded-xl border border-amber-500/15 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="font-semibold text-zinc-100">New deal</h2>
          <input
            placeholder="Deal name"
            value={dealForm.name}
            onChange={(e) => setDealForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Value (USD)"
            type="number"
            min={0}
            value={dealForm.value}
            onChange={(e) => setDealForm((f) => ({ ...f, value: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <select
            value={dealForm.contactId}
            onChange={(e) => setDealForm((f) => ({ ...f, contactId: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          >
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950"
          >
            Create deal
          </button>
        </form>
      </div>

      {selected && (
        <div className="rounded-xl border border-amber-500/25 bg-zinc-900/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-50">{selected.name}</h2>
              <p className="text-sm text-zinc-400">
                {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(selected.value)} ·{" "}
                {STAGE_LABEL[selected.stage] ?? selected.stage}
              </p>
              {selected.contact && (
                <p className="mt-2 text-sm text-zinc-300">
                  Contact: {selected.contact.name} ({selected.contact.email})
                  {selected.contact.company && ` · ${selected.contact.company}`}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Close
            </button>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-200/80">Interactions</h3>
            <ul className="mt-2 space-y-2 text-sm text-zinc-400">
              {(selected.interactions ?? []).map((i) => (
                <li key={i.id} className="border-b border-zinc-800/60 pb-2">
                  <span className="text-zinc-200">{i.type}</span> ·{" "}
                  {viewerTz ? formatUserDateTime(i.date, viewerTz) : i.date}
                  <p className="mt-1 whitespace-pre-wrap text-zinc-400">{i.notes}</p>
                </li>
              ))}
              {(selected.interactions ?? []).length === 0 && <li className="text-zinc-600">No interactions yet.</li>}
            </ul>
          </div>

          <form onSubmit={addInteraction} className="mt-4 grid gap-2 sm:grid-cols-4">
            <select
              value={interactionForm.type}
              onChange={(e) =>
                setInteractionForm((f) => ({ ...f, type: e.target.value as CrmInteractionType }))
              }
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="EMAIL">Email</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
            </select>
            <input
              type="date"
              value={interactionForm.date}
              onChange={(e) => setInteractionForm((f) => ({ ...f, date: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            <input
              placeholder="Notes"
              value={interactionForm.notes}
              onChange={(e) => setInteractionForm((f) => ({ ...f, notes: e.target.value }))}
              className="sm:col-span-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 sm:col-span-4"
            >
              Log interaction
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
