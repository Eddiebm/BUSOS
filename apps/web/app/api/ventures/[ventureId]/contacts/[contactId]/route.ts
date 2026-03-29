import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; contactId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, contactId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as Record<string, unknown>;
    const existing = await prisma.crmContact.findFirst({ where: { id: contactId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const c = await prisma.crmContact.update({
      where: { id: contactId },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.email === "string" ? { email: body.email.trim().toLowerCase() } : {}),
        ...(typeof body.company === "string" ? { company: body.company.trim() || null } : {}),
        ...(typeof body.role === "string" ? { role: body.role.trim() || null } : {}),
      },
    });
    return NextResponse.json(c);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; contactId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId, contactId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.crmContact.findFirst({ where: { id: contactId, ventureId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.crmContact.delete({ where: { id: contactId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
