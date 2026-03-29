import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeam, getVentureAccess } from "@/lib/venture-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; inviteId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, inviteId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { status?: "REVOKED" };
    if (body.status !== "REVOKED") {
      return NextResponse.json({ error: 'Only { "status": "REVOKED" } supported' }, { status: 400 });
    }

    const invite = await prisma.ventureInvite.findFirst({
      where: { id: inviteId, ventureId },
    });
    if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.ventureInvite.update({
      where: { id: inviteId },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (e) {
    console.error("[invites/PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
