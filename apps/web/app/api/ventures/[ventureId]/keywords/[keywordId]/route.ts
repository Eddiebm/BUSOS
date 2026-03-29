import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; keywordId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, keywordId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.keyword.findFirst({ where: { id: keywordId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as {
      term?: string;
      volume?: number | null;
      difficulty?: number | null;
    };

    const k = await prisma.keyword.update({
      where: { id: keywordId },
      data: {
        ...(typeof body.term === "string" ? { term: body.term.trim() } : {}),
        ...(body.volume !== undefined ? { volume: body.volume } : {}),
        ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
      },
    });
    return NextResponse.json(k);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; keywordId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, keywordId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.keyword.findFirst({ where: { id: keywordId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.keyword.delete({ where: { id: keywordId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
