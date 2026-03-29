import React from "react";
import { NextResponse } from "next/server";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { buildVentureSnapshot } from "@/lib/venture-snapshot";
import { canRead, getVentureAccess } from "@/lib/venture-access";
import { SnapshotPdfDocument } from "@/components/pdf/SnapshotTemplate";

export const runtime = "nodejs";

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

    const buffer = await renderToBuffer(
      React.createElement(SnapshotPdfDocument, { data: snapshot }) as React.ReactElement<
        React.ComponentProps<typeof Document>
      >
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="venture-snapshot.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[venture snapshot export GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
