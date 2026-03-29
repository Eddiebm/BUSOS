import type { MemberRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Prisma `where` clause: venture id + user is owner or member. */
export function ventureAccessibleByUser(userId: string) {
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}

export async function findVentureForUser(ventureId: string, userId: string) {
  return prisma.venture.findFirst({
    where: { id: ventureId, ...ventureAccessibleByUser(userId) },
  });
}

export type VentureAccessRole = MemberRole | "OWNER";

export async function getVentureAccess(
  ventureId: string,
  userId: string
): Promise<{ role: VentureAccessRole; ventureId: string; ownerId: string } | null> {
  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
    select: { id: true, ownerId: true },
  });
  if (!venture) return null;
  if (venture.ownerId === userId) {
    return { role: "OWNER", ventureId: venture.id, ownerId: venture.ownerId };
  }
  const m = await prisma.ventureMember.findUnique({
    where: { ventureId_userId: { ventureId, userId } },
  });
  if (!m) return null;
  return { role: m.role, ventureId: venture.id, ownerId: venture.ownerId };
}

export function canRead(_role: VentureAccessRole): boolean {
  return true;
}

export function canWrite(role: VentureAccessRole): boolean {
  return role !== "VIEWER";
}

export function canManageTeam(role: VentureAccessRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canFinance(role: VentureAccessRole): boolean {
  return role !== "VIEWER";
}

export function canRemoveMember(
  actor: VentureAccessRole,
  targetUserId: string,
  ownerId: string,
  targetRole: MemberRole
): boolean {
  if (targetUserId === ownerId) return false;
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return targetRole !== "ADMIN";
  return false;
}
