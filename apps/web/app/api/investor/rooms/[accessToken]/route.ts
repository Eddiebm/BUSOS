import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public (unauthenticated) data room view by access token.
 * Optional ?password= for password-protected rooms.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  try {
    const { accessToken } = await params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password") ?? undefined;

    const dataRoom = await prisma.dataRoom.findUnique({
      where: { accessToken, isActive: true },
      include: {
        venture: { select: { name: true } },
        documents: { include: { document: { select: { id: true, title: true, fileUrl: true } } }, orderBy: { order: "asc" } },
      },
    });

    if (!dataRoom) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (dataRoom.password != null && dataRoom.password !== "" && dataRoom.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }

    return NextResponse.json({
      ventureName: dataRoom.venture.name,
      documents: dataRoom.documents.map((d: { document: { id: string; title: string; fileUrl: string | null } }) => ({
        id: d.document.id,
        title: d.document.title,
        url: d.document.fileUrl,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
