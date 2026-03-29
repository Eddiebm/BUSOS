import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { getVentureForUser } from "@/lib/venture";
import { prisma } from "@/lib/prisma";
import { requireVentureWriter } from "@/lib/venture-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await getVentureForUser(ventureId, userId);
    if (!venture)
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({
      id: venture.id,
      name: venture.name,
      description: venture.description,
      stage: venture.stage,
      stressLevel: venture.stressLevel,
      stressMode: venture.stressMode,
      cashRunwayMonths: venture.cashRunwayMonths,
      monthlyBurn: venture.monthlyBurn,
      monthlyRevenue: venture.monthlyRevenue,
      lastActivityAt: venture.lastActivityAt,
      createdAt: venture.createdAt,
      stages: venture.stages,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { ventureId } = await params;
    const existing = await getVentureForUser(ventureId, userId);
    if (!existing)
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });

    const write = await requireVentureWriter(ventureId, userId);
    if (!write.ok) return write.response;

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.stage !== undefined) data.stage = Math.max(1, Math.min(13, Number(body.stage) || 1));
    if (body.cashRunwayMonths !== undefined) data.cashRunwayMonths = body.cashRunwayMonths == null ? null : Number(body.cashRunwayMonths);
    if (body.monthlyBurn !== undefined) data.monthlyBurn = body.monthlyBurn == null ? null : Number(body.monthlyBurn);
    if (body.monthlyRevenue !== undefined) data.monthlyRevenue = body.monthlyRevenue == null ? null : Number(body.monthlyRevenue);

    const venture = await prisma.venture.update({
      where: { id: ventureId },
      data,
    });
    return NextResponse.json(venture);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
