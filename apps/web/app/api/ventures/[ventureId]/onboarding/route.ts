import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireVentureReader } from "@/lib/venture-guard";

/** Lightweight checklist payload for the dashboard onboarding card. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const gate = await requireVentureReader(ventureId, userId);
    if (!gate.ok) return gate.response;

    const [dna, milestoneCount, memberCount, integrationCount, taskOpen] = await Promise.all([
      prisma.ventureDNA.findUnique({ where: { ventureId } }),
      prisma.journeyMilestone.count({ where: { ventureId } }),
      prisma.ventureMember.count({ where: { ventureId } }),
      prisma.integrationConnection.count({ where: { ventureId, connected: true } }),
      prisma.task.count({ where: { ventureId, completed: false } }),
    ]);

    return NextResponse.json({
      hasDna: Boolean(dna),
      hasMilestones: milestoneCount > 0,
      hasTeam: memberCount > 0,
      hasIntegration: integrationCount > 0,
      openTasks: taskOpen,
    });
  } catch (e) {
    console.error("[onboarding]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
