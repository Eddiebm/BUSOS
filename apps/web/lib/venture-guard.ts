import { NextResponse } from "next/server";
import { getVentureAccess, canWrite, type VentureAccessRole } from "@/lib/venture-access";

export type VentureAccessContext = { role: VentureAccessRole; ventureId: string; ownerId: string };

/** Writer: not VIEWER. Returns a Response to return early, or access context. */
export async function requireVentureWriter(
  ventureId: string,
  userId: string
): Promise<{ ok: true; access: VentureAccessContext } | { ok: false; response: NextResponse }> {
  const access = await getVentureAccess(ventureId, userId);
  if (!access) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  if (!canWrite(access.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, access };
}

/** Any member or owner (including VIEWER for read-only APIs). */
export async function requireVentureReader(
  ventureId: string,
  userId: string
): Promise<{ ok: true; access: VentureAccessContext } | { ok: false; response: NextResponse }> {
  const access = await getVentureAccess(ventureId, userId);
  if (!access) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { ok: true, access };
}
