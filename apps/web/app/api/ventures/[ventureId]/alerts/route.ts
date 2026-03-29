import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireVentureReader } from "@/lib/venture-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const gate = await requireVentureReader(ventureId, userId);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const dismissed = searchParams.get("dismissed");
    const read = searchParams.get("read");

    const where: {
      ventureId: string;
      dismissed?: boolean;
      read?: boolean;
    } = { ventureId };
    if (dismissed === "false") where.dismissed = false;
    else if (dismissed === "true") where.dismissed = true;
    if (read === "false") where.read = false;
    else if (read === "true") where.read = true;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(alerts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
