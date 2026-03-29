import { prisma } from "./prisma";

/**
 * Get venture by id only if the user is the owner. Returns null otherwise.
 */
export async function getVentureForUser(
  ventureId: string,
  userId: string
) {
  return prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
    include: { stages: { orderBy: { stageNumber: "asc" } } },
  });
}

/**
 * Get venture without stages (lighter).
 */
export async function getVentureForUserLite(ventureId: string, userId: string) {
  return prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
  });
}
