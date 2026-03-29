import { NextResponse } from "next/server";
import { Prisma, MilestoneWorkspaceType } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";
import { auditLog } from "@/lib/audit-log";

async function getMilestoneIfWrite(ventureId: string, milestoneId: string, userId: string) {
  const access = await getVentureAccess(ventureId, userId);
  if (!access) {
    return {
      response: NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 }),
      milestone: null,
    };
  }
  if (!canWrite(access.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }), milestone: null };
  }
  const milestone = await prisma.journeyMilestone.findFirst({
    where: { id: milestoneId, ventureId },
  });
  if (!milestone) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }), milestone: null };
  return { response: null, milestone };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const { response, milestone: existing } = await getMilestoneIfWrite(ventureId, milestoneId, userId);
    if (response || !existing) return response!;

    const body = (await request.json()) as Record<string, unknown>;
    const data: {
      completed?: boolean;
      completedAt?: Date | null;
      dueDate?: Date | null;
      skipped?: boolean;
      skipReason?: string | null;
      workspaceType?: MilestoneWorkspaceType;
      workspaceData?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
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
    if (body.deferred !== undefined) {
      (data as Record<string, unknown>).deferred = Boolean(body.deferred);
    }
    if (body.deferredUntil !== undefined) {
      (data as Record<string, unknown>).deferredUntil = body.deferredUntil
        ? new Date(String(body.deferredUntil))
        : null;
    }

    if (body.workspaceType !== undefined) {
      const raw = String(body.workspaceType);
      const allowed = Object.values(MilestoneWorkspaceType) as string[];
      if (!allowed.includes(raw)) {
        return NextResponse.json({ error: "Invalid workspaceType" }, { status: 400 });
      }
      data.workspaceType = raw as MilestoneWorkspaceType;
    }
    if (body.workspaceData !== undefined) {
      if (body.workspaceData === null) {
        data.workspaceData = Prisma.JsonNull;
      } else {
        data.workspaceData = body.workspaceData as Prisma.InputJsonValue;
      }
    }

    const updated = await prisma.journeyMilestone.update({
      where: { id: milestoneId },
      data,
    });
    void auditLog({
      userId,
      ventureId,
      action: "MILESTONE_UPDATE",
      resourceType: "JourneyMilestone",
      resourceId: milestoneId,
      request,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const { response, milestone: existing } = await getMilestoneIfWrite(ventureId, milestoneId, userId);
    if (response || !existing) return response!;
    if (existing.aiGenerated) {
      return NextResponse.json(
        { error: "Cannot delete auto-generated milestones" },
        { status: 403 }
      );
    }

    await prisma.journeyMilestone.delete({ where: { id: milestoneId } });
    void auditLog({
      userId,
      ventureId,
      action: "MILESTONE_DELETE",
      resourceType: "JourneyMilestone",
      resourceId: milestoneId,
      request,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
