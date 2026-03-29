import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureVentureOwner(ventureId: string, userId: string) {
  const v = await prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
  });
  if (!v) throw new Error("NOT_FOUND");
}

/**
 * POST: Trigger Blue Ocean scan for the venture.
 * In full implementation, add job to BullMQ 'blue-ocean' queue; worker runs scraper + alerts.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    await ensureVentureOwner(ventureId, userId);

    // Placeholder: in production, add to BullMQ and return jobId
    const jobId = `blue_${Date.now()}_${ventureId}`;

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
