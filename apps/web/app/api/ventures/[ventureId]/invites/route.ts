import { NextResponse } from "next/server";
import type { MemberRole } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeam, getVentureAccess } from "@/lib/venture-access";

const ROLES: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER", "OWNER"];

export async function POST(
  request: Request,
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

    const body = (await request.json()) as { email?: string; role?: MemberRole };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const role = body.role && ROLES.includes(body.role) ? body.role : "MEMBER";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (role === "OWNER") {
      return NextResponse.json({ error: "Cannot invite as OWNER" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const already = await prisma.ventureMember.findUnique({
        where: { ventureId_userId: { ventureId, userId: existing.id } },
      });
      if (already || existing.id === access.ownerId) {
        return NextResponse.json({ error: "User already on this venture" }, { status: 409 });
      }
    }

    const invite = await prisma.ventureInvite.create({
      data: {
        ventureId,
        email,
        role,
        invitedById: userId,
        status: "PENDING",
      },
    });

    await prisma.activity.create({
      data: {
        ventureId,
        userId,
        type: "TEAM_INVITE_SENT",
        description: `Invite sent to ${email} as ${role}`,
      },
    });

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[invites/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
