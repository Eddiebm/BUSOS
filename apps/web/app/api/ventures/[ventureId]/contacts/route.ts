import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rows = await prisma.crmContact.findMany({
      where: { ventureId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[contacts/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      company?: string;
      role?: string;
    };
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 });

    const c = await prisma.crmContact.create({
      data: {
        ventureId,
        name,
        email,
        company: body.company?.trim() || null,
        role: body.role?.trim() || null,
      },
    });
    return NextResponse.json(c);
  } catch (e) {
    console.error("[contacts/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
