import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Best-effort audit trail for sensitive actions. Never throws to callers.
 * Use for compliance/debugging; pair with RBAC on all mutating routes.
 */
export async function auditLog(input: {
  userId: string;
  ventureId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  request?: Request | null;
}): Promise<void> {
  try {
    const h = input.request?.headers;
    const forwarded = h?.get("x-forwarded-for");
    const ip =
      (forwarded ? forwarded.split(",")[0]?.trim() : null) ?? h?.get("x-real-ip") ?? undefined;
    const ua = h?.get("user-agent") ?? undefined;
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        ventureId: input.ventureId ?? undefined,
        action: input.action,
        resourceType: input.resourceType ?? undefined,
        resourceId: input.resourceId ?? undefined,
        ...(input.metadata !== undefined && input.metadata !== null
          ? { metadata: input.metadata }
          : {}),
        ipAddress: ip ?? undefined,
        userAgent: ua ?? undefined,
      },
    });
  } catch (e) {
    console.error("[auditLog]", e);
  }
}
