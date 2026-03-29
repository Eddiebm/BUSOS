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
    <div className="mx-auto max-w-3xl space-y-8 pb-16 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/ventures/${ventureId}/settings`} className="text-sm text-primary/90 hover:text-primary">
            ← Venture settings
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">Roles, invites, and presence — global-first collaboration.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModal(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Invite member
          </button>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-primary/35 bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Invite by email</h2>
            <label className="mt-4 block text-sm text-muted-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              placeholder="founder@company.com"
            />
            <label className="mt-3 block text-sm text-muted-foreground">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button
                type="button"
                onClick={invite}
                disabled={sending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-primary/25 bg-card/90 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Members</h2>
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading…</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">
                    {m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (m.name ?? m.email).slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{m.name ?? m.email}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active:{" "}
                      {m.lastActiveAt || m.lastLoginAt
                        ? formatUserDateTime(m.lastActiveAt ?? m.lastLoginAt ?? "", viewerTz)
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.id.startsWith("owner:") ? (
                    <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">OWNER</span>
                  ) : canManage ? (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="text-sm text-destructive hover:text-destructive/80"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-1 text-xs text-primary">{m.role}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-primary/25 bg-card/90 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Pending invites</h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending invites.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">
                  {i.email} <span className="text-muted-foreground">({i.role})</span>
                </span>
                {canManage && (
                  <button type="button" onClick={() => revoke(i.id)} className="text-primary/90 hover:text-primary">
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
