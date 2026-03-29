import { prisma } from "./prisma";

/** Venture visible to owner or any venture member. */
export async function getVentureForUser(ventureId: string, userId: string) {
  return prisma.venture.findFirst({
    where: {
      id: ventureId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: { stages: { orderBy: { stageNumber: "asc" } } },
  });
}

/**
 * Get venture without stages (lighter).
 */
export async function getVentureForUserLite(ventureId: string, userId: string) {
  return prisma.venture.findFirst({
    where: {
      id: ventureId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });
}
