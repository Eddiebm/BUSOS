import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVentureAccess } from "@/lib/venture-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const take = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));

    const rows = await prisma.activity.findMany({
      where: { ventureId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { id: true, name: true, email: true, imageUrl: true } },
      },
    });

    return NextResponse.json(
      rows.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        user: a.user,
      }))
    );
  } catch (e) {
    console.error("[activities/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
