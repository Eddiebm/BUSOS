import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, timezone: true },
    });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(u);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as { timezone?: string };
    const tz = typeof body.timezone === "string" ? body.timezone.trim().slice(0, 64) : null;
    await prisma.user.update({
      where: { id: userId },
      data: { ...(tz ? { timezone: tz } : {}) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
