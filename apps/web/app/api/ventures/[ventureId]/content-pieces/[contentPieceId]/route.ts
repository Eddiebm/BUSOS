import { NextResponse } from "next/server";
import type { ContentChannel, ContentStatus } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; contentPieceId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, contentPieceId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.contentPiece.findFirst({
      where: { id: contentPieceId, ventureId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as {
      title?: string;
      status?: ContentStatus;
      channel?: ContentChannel;
      publishAt?: string | null;
    };

    const c = await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(body.status != null ? { status: body.status } : {}),
        ...(body.channel != null ? { channel: body.channel } : {}),
        ...(body.publishAt !== undefined
          ? { publishAt: body.publishAt ? new Date(body.publishAt) : null }
          : {}),
      },
    });
    return NextResponse.json(c);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; contentPieceId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, contentPieceId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.contentPiece.findFirst({
      where: { id: contentPieceId, ventureId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.contentPiece.delete({ where: { id: contentPieceId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
