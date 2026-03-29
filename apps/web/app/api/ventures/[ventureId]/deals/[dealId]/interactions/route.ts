import { NextResponse } from "next/server";
import type { CrmInteractionType } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; dealId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, dealId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const deal = await prisma.crmDeal.findFirst({ where: { id: dealId, ventureId } });
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as {
      date?: string;
      type?: CrmInteractionType;
      notes?: string;
    };
    const notes = String(body.notes ?? "").trim();
    if (!notes) return NextResponse.json({ error: "notes required" }, { status: 400 });

    const i = await prisma.crmInteraction.create({
      data: {
        dealId,
        date: body.date ? new Date(body.date) : new Date(),
        type: body.type ?? "EMAIL",
        notes,
      },
    });
    return NextResponse.json(i);
  } catch (e) {
    console.error("[interactions/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
