import { NextResponse } from "next/server";
import type { ShareholderKind } from "@prisma/client";
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

    const rows = await prisma.shareholder.findMany({
      where: { ventureId },
      include: { grants: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[shareholders/GET]", e);
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

    const body = (await request.json()) as { name?: string; type?: ShareholderKind };
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const s = await prisma.shareholder.create({
      data: {
        ventureId,
        name,
        type: body.type ?? "FOUNDER",
      },
    });
    return NextResponse.json(s);
  } catch (e) {
    console.error("[shareholders/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
