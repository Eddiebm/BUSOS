import { NextResponse } from "next/server";
import type { MemberRole } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageTeam,
  canRemoveMember,
  getVentureAccess,
} from "@/lib/venture-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; memberId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, memberId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { role?: MemberRole };
    if (!body.role) return NextResponse.json({ error: "role required" }, { status: 400 });

    const venture = await prisma.venture.findUnique({ where: { id: ventureId } });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (memberId.startsWith("owner:")) {
      return NextResponse.json({ error: "Cannot change owner role here" }, { status: 400 });
    }

    const row = await prisma.ventureMember.findFirst({
      where: { id: memberId, ventureId },
      include: { user: true },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (row.userId === venture.ownerId) {
      return NextResponse.json({ error: "Use transfer ownership elsewhere" }, { status: 400 });
    }

    if (access.role === "ADMIN" && row.role === "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.role === "OWNER") {
      return NextResponse.json({ error: "Cannot assign OWNER via this endpoint" }, { status: 400 });
    }

    const updated = await prisma.ventureMember.update({
      where: { id: memberId },
      data: { role: body.role },
    });

    return NextResponse.json({ id: updated.id, role: updated.role });
  } catch (e) {
    console.error("[members/PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; memberId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, memberId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const venture = await prisma.venture.findUnique({ where: { id: ventureId } });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (memberId.startsWith("owner:")) {
      return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });
    }

    const row = await prisma.ventureMember.findFirst({
      where: { id: memberId, ventureId },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canRemoveMember(access.role, row.userId, venture.ownerId, row.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.ventureMember.delete({ where: { id: memberId } });

    await prisma.activity.create({
      data: {
        ventureId,
        userId,
        type: "TEAM_MEMBER_ADDED",
        description: `Member removed from venture`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[members/DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
