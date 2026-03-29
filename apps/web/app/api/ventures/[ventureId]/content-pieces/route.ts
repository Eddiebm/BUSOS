import { NextResponse } from "next/server";
import type { ContentChannel, ContentStatus } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

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

    const rows = await prisma.contentPiece.findMany({
      where: { ventureId },
      orderBy: { publishAt: "asc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[content-pieces/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as {
      title?: string;
      status?: ContentStatus;
      channel?: ContentChannel;
      publishAt?: string | null;
    };
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    const c = await prisma.contentPiece.create({
      data: {
        ventureId,
        title,
        status: body.status ?? "DRAFT",
        channel: body.channel ?? "BLOG",
        publishAt: body.publishAt ? new Date(body.publishAt) : null,
      },
    });
    return NextResponse.json(c);
  } catch (e) {
    console.error("[content-pieces/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
