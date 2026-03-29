import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeam, getVentureAccess } from "@/lib/venture-access";

/** Owner / Admin only — recent audit log entries for the venture. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.auditLog.findMany({
      where: { ventureId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
        userId: true,
      },
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error("[audit]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
