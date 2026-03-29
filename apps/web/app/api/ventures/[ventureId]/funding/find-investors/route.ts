import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { FUNDING_INVESTORS, matchInvestorsForVenture } from "@/lib/funding-investors";
import { prisma } from "@/lib/prisma";
import { ventureAccessibleByUser } from "@/lib/venture-access";
import { requireVentureReader } from "@/lib/venture-guard";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const gate = await requireVentureReader(ventureId, userId);
    if (!gate.ok) return gate.response;

    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ...ventureAccessibleByUser(userId) },
      include: { dna: true },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const ranked = matchInvestorsForVenture({
      stage: venture.stage,
      name: venture.name,
      stressMode: venture.stressMode,
      industryVertical: venture.dna?.industryVertical ?? null,
    });

    const topMatches = ranked.slice(0, 24);
    const matchSummary = `Ada reviewed ${FUNDING_INVESTORS.length} programs and funds—from local and regional options to national US and international (Africa, Europe, Asia, global)—and ranked those that best fit ${venture.name} at stage ${venture.stage}/13 using your industry and Venture DNA. Confirm each fund’s current mandate before you reach out.`;

    return NextResponse.json({
      investors: topMatches,
      totalInDirectory: FUNDING_INVESTORS.length,
      matchSummary,
      venture: {
        name: venture.name,
        stage: venture.stage,
        stressMode: venture.stressMode,
      },
    });
  } catch (e) {
    console.error("[funding/find-investors]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
