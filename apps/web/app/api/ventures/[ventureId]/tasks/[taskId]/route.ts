import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTaskIfVentureOwner(ventureId: string, taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ventureId },
    include: { venture: { select: { ownerId: true } } },
  });
  if (!task || task.venture.ownerId !== userId) return null;
  return task;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; taskId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, taskId } = await params;
    const existing = await getTaskIfVentureOwner(ventureId, taskId, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.completed !== undefined) {
      data.completed = Boolean(body.completed);
      data.completedAt = body.completed ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; taskId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, taskId } = await params;
    const existing = await getTaskIfVentureOwner(ventureId, taskId, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.task.delete({ where: { id: taskId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
