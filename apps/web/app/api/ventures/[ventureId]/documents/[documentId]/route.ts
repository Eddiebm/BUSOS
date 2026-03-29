import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireVentureReader } from "@/lib/venture-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; documentId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, documentId } = await params;
    const gate = await requireVentureReader(ventureId, userId);
    if (!gate.ok) return gate.response;

    const doc = await prisma.document.findFirst({
      where: {
        id: documentId,
        ventureId,
      },
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      content: doc.content,
      fileUrl: doc.fileUrl,
      isAIGenerated: doc.isAIGenerated,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
