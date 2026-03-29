import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { buildVentureSnapshot } from "@/lib/venture-snapshot";
import { canRead, getVentureAccess } from "@/lib/venture-access";

export async function GET(
  _request: Request,
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

    const snapshot = await buildVentureSnapshot(ventureId);
    if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("[venture snapshot GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
