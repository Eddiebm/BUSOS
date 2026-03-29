import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireVentureReader, requireVentureWriter } from "@/lib/venture-guard";
import { auditLog } from "@/lib/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const gate = await requireVentureReader(ventureId, userId);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const urgentOnly = searchParams.get("urgentOnly") === "true";

    const where: { ventureId: string; completed?: boolean; dueDate?: { lt: Date } } = { ventureId };
    if (urgentOnly) {
      where.completed = false;
      where.dueDate = { lt: new Date() };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const gate = await requireVentureWriter(ventureId, userId);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const title = String(body?.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const task = await prisma.task.create({
      data: {
        ventureId,
        title,
        description: body.description?.trim() || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdById: userId,
      },
    });
    void auditLog({
      userId,
      ventureId,
      action: "TASK_CREATE",
      resourceType: "Task",
      resourceId: task.id,
      request,
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
