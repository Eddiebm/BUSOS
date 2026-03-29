import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORY_ORDER = ["VALIDATION", "PRODUCT", "LEGAL", "FINANCIAL", "GROWTH", "IP"];

function sortMilestones<T extends { category: string; order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
    return a.order - b.order;
  });
}

export async function GET(
  _request: Request,
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

    const list = await prisma.journeyMilestone.findMany({
      where: { ventureId },
    });
    return NextResponse.json(sortMilestones(list));
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
    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ownerId: userId },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
