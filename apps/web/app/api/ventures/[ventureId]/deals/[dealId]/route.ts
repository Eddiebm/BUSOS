import { NextResponse } from "next/server";
import type { CrmDealKind } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; dealId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, dealId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const d = await prisma.crmDeal.findFirst({
      where: { id: dealId, ventureId },
      include: { contact: true, interactions: { orderBy: { date: "desc" } } },
    });
    if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(d);
  } catch (e) {
    console.error("[deal/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; dealId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, dealId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as {
      name?: string;
      value?: number;
      stage?: string;
      kind?: CrmDealKind;
      contactId?: string | null;
    };

    const existing = await prisma.crmDeal.findFirst({ where: { id: dealId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const d = await prisma.crmDeal.update({
      where: { id: dealId },
      data: {
        ...(body.name != null ? { name: String(body.name).trim() } : {}),
        ...(body.value != null ? { value: Number(body.value) } : {}),
        ...(body.stage != null ? { stage: String(body.stage) } : {}),
        ...(body.kind != null ? { kind: body.kind } : {}),
        ...(body.contactId !== undefined ? { contactId: body.contactId } : {}),
      },
    });

    await prisma.activity.create({
      data: {
        ventureId,
        userId,
        type: "DEAL_MOVED",
        description: `Deal "${d.name}" updated`,
      },
    });

    return NextResponse.json(d);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; dealId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, dealId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.crmDeal.delete({ where: { id: dealId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
