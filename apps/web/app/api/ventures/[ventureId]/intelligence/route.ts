import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRead, getVentureAccess } from "@/lib/venture-access";

const CATEGORY_PRIORITY: Record<string, number> = {
  LEGAL: 0,
  FINANCIAL: 1,
  VALIDATION: 2,
  PRODUCT: 3,
  GROWTH: 4,
  IP: 5,
};

export type IntelligenceType = "CRITICAL_GAP" | "ON_TRACK" | "NO_DNA";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;

    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canRead(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      include: { dna: true },
    });

    if (!venture) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    if (!venture.dna) {
      return NextResponse.json({
        type: "NO_DNA" satisfies IntelligenceType,
        message:
          "Tell Ada your story to unlock your personalized roadmap.",
      });
    }

    const milestones = await prisma.journeyMilestone.findMany({
      where: { ventureId },
    });

    const incomplete = milestones.filter((m) => !m.completed && !m.skipped);

    if (milestones.length === 0 || incomplete.length === 0) {
      return NextResponse.json({
        type: "ON_TRACK" satisfies IntelligenceType,
        message: "Your journey is on track. Ada is watching.",
      });
    }

    incomplete.sort((a, b) => {
      const pa = CATEGORY_PRIORITY[a.category] ?? 99;
      const pb = CATEGORY_PRIORITY[b.category] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.order - b.order;
    });

    const critical = incomplete[0];
    if (!critical) {
      return NextResponse.json({
        type: "ON_TRACK" satisfies IntelligenceType,
        message: "Your journey is on track. Ada is watching.",
      });
    }

    return NextResponse.json({
      type: "CRITICAL_GAP" satisfies IntelligenceType,
      message: `You have not completed "${critical.title}" — this is your highest risk right now.`,
      milestone: {
        title: critical.title,
        category: critical.category,
      },
    });
  } catch (e) {
    console.error("[intelligence/GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
