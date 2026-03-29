import { NextResponse } from "next/server";
import type { CrmDealKind } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kind = new URL(request.url).searchParams.get("kind") as CrmDealKind | null;
    const rows = await prisma.crmDeal.findMany({
      where: { ventureId, ...(kind ? { kind } : {}) },
      include: { contact: true, interactions: { orderBy: { date: "desc" }, take: 5 } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[deals/GET]", e);
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
      name?: string;
      value?: number;
      kind?: CrmDealKind;
      stage?: string;
      contactId?: string | null;
    };
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const d = await prisma.crmDeal.create({
      data: {
        ventureId,
        name,
        value: Number(body.value) || 0,
        kind: body.kind ?? "SALES",
        stage: String(body.stage ?? "LEAD"),
        contactId: body.contactId || null,
      },
    });
    return NextResponse.json(d);
  } catch (e) {
    console.error("[deals/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
