import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureVentureOwner(ventureId: string, userId: string) {
  const v = await prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
  });
  if (!v) throw new Error("NOT_FOUND");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    await ensureVentureOwner(ventureId, userId);

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
    if ((e as Error).message === "NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    await ensureVentureOwner(ventureId, userId);

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
    return NextResponse.json(task);
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
