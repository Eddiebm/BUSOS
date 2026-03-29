"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatUserDateTime } from "@/lib/datetime";

type MemberRow = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: string;
  lastActiveAt: string | null;
  lastLoginAt: string | null;
  timezone: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function TeamSettingsPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;
  const viewerTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [accessRole, setAccessRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/members`);
      if (!res.ok) return;
      const d = (await res.json()) as { members: MemberRow[]; invites: InviteRow[]; accessRole: string };
      setMembers(d.members ?? []);
      setInvites(d.invites ?? []);
      setAccessRole(d.accessRole ?? "");
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: viewerTz }),
    }).catch(() => {});
  }, [viewerTz]);

  const canManage = accessRole === "OWNER" || accessRole === "ADMIN";

  const invite = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: inviteRole }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Invite failed");
        return;
      }
      toast.success("Invite sent");
      setModal(false);
      setEmail("");
      await load();
    } finally {
      setSending(false);
    }
  };

  const revoke = async (id: string) => {
    const res = await fetch(`/api/ventures/${ventureId}/invites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVOKED" }),
    });
    if (res.ok) {
      toast.success("Invite revoked");
      await load();
    } else toast.error("Could not revoke");
  };

  const removeMember = async (memberId: string) => {
    if (!globalThis.confirm("Remove this member?")) return;
    const res = await fetch(`/api/ventures/${ventureId}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removed");
      await load();
    } else toast.error("Could not remove");
  };

  const changeRole = async (memberId: string, role: string) => {
    const res = await fetch(`/api/ventures/${ventureId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      await load();
    } else toast.error("Could not update role");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16 text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/ventures/${ventureId}/settings`} className="text-sm text-amber-500/90 hover:text-amber-400">
            ← Venture settings
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-zinc-400">Roles, invites, and presence — global-first collaboration.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModal(true)}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Invite member
          </button>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-500/30 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Invite by email</h2>
            <label className="mt-4 block text-sm text-zinc-400">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
              placeholder="founder@company.com"
            />
            <label className="mt-3 block text-sm text-zinc-400">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="rounded-lg px-3 py-2 text-zinc-400 hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                onClick={invite}
                disabled={sending}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-amber-500/20 bg-zinc-900/90 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/80">Members</h2>
        {loading ? (
          <p className="mt-4 text-zinc-500">Loading…</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-800">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-amber-200">
                    {m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (m.name ?? m.email).slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{m.name ?? m.email}</p>
                    <p className="text-xs text-zinc-500">{m.email}</p>
                    <p className="text-xs text-zinc-500">
                      Last active:{" "}
                      {m.lastActiveAt || m.lastLoginAt
                        ? formatUserDateTime(m.lastActiveAt ?? m.lastLoginAt ?? "", viewerTz)
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.id.startsWith("owner:") ? (
                    <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-200">OWNER</span>
                  ) : canManage ? (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value)}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-amber-200/90">{m.role}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-zinc-900/90 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/80">Pending invites</h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No pending invites.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-800">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-300">
                  {i.email} <span className="text-zinc-500">({i.role})</span>
                </span>
                {canManage && (
                  <button type="button" onClick={() => revoke(i.id)} className="text-amber-500/90 hover:text-amber-400">
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
