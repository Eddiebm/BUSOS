import { NextResponse } from "next/server";
import type { MemberRole } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVentureAccess } from "@/lib/venture-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      include: {
        owner: { select: { id: true, email: true, name: true, imageUrl: true, lastLoginAt: true, lastActiveAt: true, timezone: true } },
        members: {
          include: {
            user: { select: { id: true, email: true, name: true, imageUrl: true, lastLoginAt: true, lastActiveAt: true, timezone: true } },
          },
        },
        ventureInvites: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          include: {
            invitedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const ownerRow = {
      id: `owner:${venture.ownerId}`,
      userId: venture.owner.id,
      email: venture.owner.email,
      name: venture.owner.name,
      imageUrl: venture.owner.imageUrl,
      role: "OWNER" as const,
      lastLoginAt: venture.owner.lastLoginAt?.toISOString() ?? null,
      lastActiveAt: venture.owner.lastActiveAt?.toISOString() ?? null,
      timezone: venture.owner.timezone,
    };

    const memberRows = venture.members
      .filter((m) => m.userId !== venture.ownerId)
      .map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        imageUrl: m.user.imageUrl,
        role: m.role as MemberRole,
        lastLoginAt: m.user.lastLoginAt?.toISOString() ?? null,
        lastActiveAt: m.user.lastActiveAt?.toISOString() ?? null,
        timezone: m.user.timezone,
      }));

    const merged = [ownerRow, ...memberRows];

    const invites = venture.ventureInvites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      token: i.token,
      invitedBy: i.invitedBy,
      createdAt: i.createdAt.toISOString(),
    }));

    return NextResponse.json({ members: merged, invites, accessRole: access.role });
  } catch (e) {
    console.error("[members/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
