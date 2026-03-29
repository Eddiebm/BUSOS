import { NextResponse } from "next/server";
import type { EquityKind } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; shareholderId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, shareholderId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sh = await prisma.shareholder.findFirst({ where: { id: shareholderId, ventureId } });
    if (!sh) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as {
      date?: string;
      shares?: number;
      equityType?: EquityKind;
    };
    const shares = Number(body.shares);
    if (!Number.isFinite(shares) || shares <= 0) {
      return NextResponse.json({ error: "positive shares required" }, { status: 400 });
    }

    const g = await prisma.equityGrant.create({
      data: {
        shareholderId,
        date: body.date ? new Date(body.date) : new Date(),
        shares,
        equityType: body.equityType ?? "COMMON",
      },
    });
    return NextResponse.json(g);
  } catch (e) {
    console.error("[grants/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
