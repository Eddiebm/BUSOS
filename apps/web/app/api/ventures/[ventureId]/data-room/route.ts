import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRead, canWrite, getVentureAccess } from "@/lib/venture-access";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canRead(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const dataRoom = await prisma.dataRoom.findUnique({
      where: { ventureId },
      include: {
        documents: { include: { document: true }, orderBy: { order: "asc" } },
        investors: true,
      },
    });
    if (!dataRoom) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(dataRoom);
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
    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canWrite(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.dataRoom.findUnique({
      where: { ventureId },
    });
    if (existing) return NextResponse.json(existing);

    const body = await request.json().catch(() => ({}));
    const password = (body.password as string)?.trim() || null;

    const dataRoom = await prisma.dataRoom.create({
      data: {
        ventureId,
        accessToken: generateToken(),
        password,
      },
    });
    return NextResponse.json(dataRoom);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
