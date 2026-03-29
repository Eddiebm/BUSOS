import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateStress } from "@/lib/stress";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ownerId: userId },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const overdueCount = await prisma.task.count({
      where: {
        ventureId,
        completed: false,
        dueDate: { lt: now },
      },
    });

    const lastActivity = venture.lastActivityAt ?? venture.createdAt;
    const daysSinceActivity = Math.floor(
      (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    const { level, mode } = calculateStress(
      venture.cashRunwayMonths ?? null,
      overdueCount,
      daysSinceActivity
    );

    // Persist so UI and Ada can use it
    await prisma.venture.update({
      where: { id: ventureId },
      data: { stressLevel: level, stressMode: mode },
    });

    return NextResponse.json({
      stressLevel: level,
      mode,
      factors: {
        runway: venture.cashRunwayMonths ?? null,
        overdueTasks: overdueCount,
        daysSinceLogin: daysSinceActivity,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
