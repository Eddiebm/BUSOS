import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ventures = await prisma.venture.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        stage: true,
        stressLevel: true,
        stressMode: true,
        cashRunwayMonths: true,
        lastActivityAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(ventures);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const venture = await prisma.$transaction(async (tx) => {
      const v = await tx.venture.create({
        data: {
          name,
          description: body.description?.trim() || null,
          ownerId: userId,
        },
      });
      await tx.ventureMember.upsert({
        where: { ventureId_userId: { ventureId: v.id, userId } },
        create: { ventureId: v.id, userId, role: "OWNER" },
        update: { role: "OWNER" },
      });
      return v;
    });
    return NextResponse.json(venture);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
