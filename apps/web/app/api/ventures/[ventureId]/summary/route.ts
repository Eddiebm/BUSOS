import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { getVentureForUserLite } from "@/lib/venture";
import { calculateStress } from "@/lib/stress";
import { prisma } from "@/lib/prisma";

/**
 * Single round-trip: venture + stress. Use this for dashboard load instead of GET venture + GET stress.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await getVentureForUserLite(ventureId, userId);
    if (!venture)
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });

    const now = new Date();
    const overdueCount = await prisma.journeyMilestone.count({
      where: {
        ventureId,
        completed: false,
        skipped: false,
        dueDate: { lt: now },
      },
    });
    const lastActivity = venture.lastActivityAt ?? venture.createdAt;
    const daysSince = Math.floor(
      (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );
    const { level, mode } = calculateStress(
      venture.cashRunwayMonths ?? null,
      overdueCount,
      daysSince
    );

    await prisma.venture.update({
      where: { id: ventureId },
      data: { stressLevel: level, stressMode: mode },
    });

    const res = NextResponse.json({
      venture: {
        id: venture.id,
        name: venture.name,
        description: venture.description,
        stage: venture.stage,
        stressLevel: level,
        stressMode: mode,
        cashRunwayMonths: venture.cashRunwayMonths,
        monthlyBurn: venture.monthlyBurn,
        monthlyRevenue: venture.monthlyRevenue,
        lastActivityAt: venture.lastActivityAt,
        createdAt: venture.createdAt,
        stages: [], // omit for summary; client can fetch full venture if needed
      },
      stress: {
        stressLevel: level,
        mode,
        factors: {
          runway: venture.cashRunwayMonths ?? null,
          overdueMilestones: overdueCount,
          daysSinceLogin: daysSince,
        },
      },
    });

    res.headers.set("Cache-Control", "private, max-age=60");
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
