import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMilestoneForOwner(
  ventureId: string,
  milestoneId: string,
  userId: string
) {
  return prisma.journeyMilestone.findFirst({
    where: {
      id: milestoneId,
      ventureId,
      venture: { ownerId: userId },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const existing = await getMilestoneForOwner(ventureId, milestoneId, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const data: {
      completed?: boolean;
      completedAt?: Date | null;
      dueDate?: Date | null;
      skipped?: boolean;
      skipReason?: string | null;
    } = {};

    if (body.completed !== undefined) {
      const completed = Boolean(body.completed);
      data.completed = completed;
      data.completedAt = completed ? new Date() : null;
    }
    if (body.dueDate !== undefined) {
      const raw = body.dueDate;
      data.dueDate =
        raw === null || raw === ""
          ? null
          : typeof raw === "string"
            ? new Date(raw)
            : raw instanceof Date
              ? raw
              : null;
    }
    if (body.skipped !== undefined) data.skipped = Boolean(body.skipped);
    if (body.skipReason !== undefined) {
      data.skipReason = body.skipReason ? String(body.skipReason) : null;
    }

    const updated = await prisma.journeyMilestone.update({
      where: { id: milestoneId },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const existing = await getMilestoneForOwner(ventureId, milestoneId, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.aiGenerated) {
      return NextResponse.json(
        { error: "Cannot delete auto-generated milestones" },
        { status: 403 }
      );
    }

    await prisma.journeyMilestone.delete({ where: { id: milestoneId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
