import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAlertIfVentureOwner(ventureId: string, alertId: string, userId: string) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, ventureId },
    include: { venture: { select: { ownerId: true } } },
  });
  if (!alert || alert.venture.ownerId !== userId) return null;
  return alert;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; alertId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, alertId } = await params;
    const existing = await getAlertIfVentureOwner(ventureId, alertId, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.read !== undefined) data.read = Boolean(body.read);
    if (body.dismissed !== undefined) data.dismissed = Boolean(body.dismissed);

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data,
    });
    return NextResponse.json(alert);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
