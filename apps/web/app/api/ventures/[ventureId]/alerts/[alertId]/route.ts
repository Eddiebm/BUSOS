import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

async function getAlertForWrite(ventureId: string, alertId: string, userId: string) {
  const access = await getVentureAccess(ventureId, userId);
  if (!access) {
    return {
      response: NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 }),
      alert: null,
    };
  }
  if (!canWrite(access.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }), alert: null };
  }
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, ventureId },
  });
  if (!alert) return { response: NextResponse.json({ error: "Not found" }, { status: 404 }), alert: null };
  return { response: null, alert };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; alertId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, alertId } = await params;
    const { response, alert } = await getAlertForWrite(ventureId, alertId, userId);
    if (response || !alert) return response!;

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.read !== undefined) data.read = Boolean(body.read);
    if (body.dismissed !== undefined) data.dismissed = Boolean(body.dismissed);

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
