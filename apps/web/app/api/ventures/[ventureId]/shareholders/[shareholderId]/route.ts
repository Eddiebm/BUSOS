import { NextResponse } from "next/server";
import type { ShareholderKind } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; shareholderId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, shareholderId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.shareholder.findFirst({ where: { id: shareholderId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as { name?: string; type?: ShareholderKind };
    const s = await prisma.shareholder.update({
      where: { id: shareholderId },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(body.type != null ? { type: body.type } : {}),
      },
    });
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; shareholderId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, shareholderId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.shareholder.findFirst({ where: { id: shareholderId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.shareholder.delete({ where: { id: shareholderId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
