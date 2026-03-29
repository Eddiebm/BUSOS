import { NextResponse } from "next/server";
import type { IntegrationProvider } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeam, getVentureAccess } from "@/lib/venture-access";

const PROVIDERS: IntegrationProvider[] = ["SLACK", "GITHUB", "GOOGLE_CALENDAR"];

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

    const rows = await prisma.integrationConnection.findMany({
      where: { ventureId },
    });
    const map = Object.fromEntries(rows.map((r) => [r.provider, r]));
    return NextResponse.json({
      providers: PROVIDERS.map((p) => ({
        provider: p,
        connected: map[p]?.connected ?? false,
        metadata: map[p]?.metadata ?? null,
      })),
    });
  } catch (e) {
    console.error("[integrations/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Stub OAuth connect — stores placeholder; production would exchange code for tokens. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canManageTeam(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { provider?: IntegrationProvider };
    if (!body.provider || !PROVIDERS.includes(body.provider)) {
      return NextResponse.json({ error: "invalid provider" }, { status: 400 });
    }

    const row = await prisma.integrationConnection.upsert({
      where: {
        ventureId_provider: { ventureId, provider: body.provider },
      },
      create: {
        ventureId,
        userId,
        provider: body.provider,
        connected: true,
        metadata: { stub: true, connectedAt: new Date().toISOString() },
      },
      update: {
        connected: true,
        userId,
        metadata: { stub: true, connectedAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({ ok: true, provider: row.provider, connected: row.connected });
  } catch (e) {
    console.error("[integrations/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
