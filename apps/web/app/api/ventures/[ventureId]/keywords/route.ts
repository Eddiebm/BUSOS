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

    const rows = await prisma.keyword.findMany({ where: { ventureId }, orderBy: { term: "asc" } });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[keywords/GET]", e);
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

    const body = (await request.json()) as { term?: string; volume?: number; difficulty?: number };
    const term = String(body.term ?? "").trim();
    if (!term) return NextResponse.json({ error: "term required" }, { status: 400 });

    const k = await prisma.keyword.create({
      data: {
        ventureId,
        term,
        volume: body.volume != null ? Number(body.volume) : null,
        difficulty: body.difficulty != null ? Number(body.difficulty) : null,
      },
    });
    return NextResponse.json(k);
  } catch (e) {
    console.error("[keywords/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
