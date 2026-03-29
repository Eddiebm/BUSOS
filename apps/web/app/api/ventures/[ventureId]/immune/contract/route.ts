import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

/**
 * POST: Upload contract for analysis (multipart/form-data).
 * In full implementation, enqueue job and return jobId; worker runs immune-system analyzer.
 */
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim() || "Contract";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // In production: add to BullMQ queue and return jobId; worker calls immune-system analyzeContract
    const jobId = `job_${Date.now()}_${ventureId}`;

    // Store as CONTRACT document; analysis can be filled by worker
    const document = await prisma.document.create({
      data: {
        ventureId,
        title: file.name || title,
        type: "CONTRACT",
        content: null,
        fileUrl: null, // Would be S3 URL after upload
        isAIGenerated: false,
        createdById: userId,
        metadata: { jobId, status: "pending", fileName: file.name },
      },
    });

    return NextResponse.json({ jobId, documentId: document.id }, { status: 202 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
