import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRead, canWrite, getVentureAccess } from "@/lib/venture-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canRead(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const milestone = await prisma.journeyMilestone.findFirst({
      where: { id: milestoneId, ventureId },
      select: { workspaceData: true },
    });
    if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: milestone.workspaceData });
  } catch (e) {
    console.error("[milestone workspace GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canWrite(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exists = await prisma.journeyMilestone.findFirst({
      where: { id: milestoneId, ventureId },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as { data?: unknown };
    if (!("data" in body)) {
      return NextResponse.json({ error: "data is required" }, { status: 400 });
    }

    const workspaceData =
      body.data === null ? Prisma.JsonNull : (body.data as Prisma.InputJsonValue);

    await prisma.journeyMilestone.update({
      where: { id: milestoneId },
      data: { workspaceData },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[milestone workspace PATCH]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
