import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sortJourneyMilestones } from "@/lib/sort-milestones";
import { requireVentureReader, requireVentureWriter } from "@/lib/venture-guard";

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

    const list = await prisma.journeyMilestone.findMany({
      where: { ventureId },
    });
    return NextResponse.json(sortJourneyMilestones(list));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
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
    const gate = await requireVentureWriter(ventureId, userId);
    if (!gate.ok) return gate.response;

    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "VALIDATION").trim() || "VALIDATION";
    if (!title || !description) {
      return NextResponse.json({ error: "title and description are required" }, { status: 400 });
    }

    const maxOrder = await prisma.journeyMilestone.aggregate({
      where: { ventureId },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    const created = await prisma.journeyMilestone.create({
      data: {
        ventureId,
        category,
        title,
        description,
        order,
        aiGenerated: false,
      },
    });
    return NextResponse.json(created);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
