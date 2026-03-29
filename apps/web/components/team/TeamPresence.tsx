"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Member = {
  userId: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  lastActiveAt: string | null;
};

export function TeamPresence({ ventureId }: { ventureId: string }) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch(`/api/ventures/${ventureId}/members`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.members) {
          setMembers(
            d.members.map((m: Member) => ({
              userId: m.userId,
              name: m.name,
              email: m.email,
              imageUrl: m.imageUrl,
              lastActiveAt: m.lastActiveAt,
            }))
          );
        }
      })
      .catch(() => setMembers([]));
  }, [ventureId]);

  const online = (iso: string | null) => {
    if (!iso) return false;
    return Date.now() - new Date(iso).getTime() < 10 * 60 * 1000;
  };

  if (members.length === 0) return null;

  return (
    <div className="flex items-center gap-1" aria-label="Team presence">
      {members.slice(0, 6).map((m) => (
        <div
          key={m.userId}
          title={m.name ?? m.email}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold",
            online(m.lastActiveAt)
              ? "border-primary/50 bg-muted text-primary"
              : "border-border bg-muted text-muted-foreground"
          )}
        >
          {m.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            (m.name ?? m.email).slice(0, 2).toUpperCase()
          )}
        </div>
      ))}
      {members.length > 6 && (
        <span className="pl-1 text-xs text-muted-foreground">+{members.length - 6}</span>
      )}
    </div>
  );
}
