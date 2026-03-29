import { NextResponse } from "next/server";
import { DocType } from "@prisma/client";
import OpenAI from "openai";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureVentureOwner(ventureId: string, userId: string) {
  const v = await prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
  });
  if (!v) throw new Error("NOT_FOUND");
}

const VALID_TYPES: DocType[] = [
  "BUSINESS_PLAN",
  "MARKET_REPORT",
  "VALUE_PROPOSITION",
  "PATENT_DRAFT",
  "TRADEMARK_DRAFT",
  "COPYRIGHT_DRAFT",
  "FINANCIAL_MODEL",
  "MARKETING_STRATEGY",
  "SALES_PITCH",
  "CONTRACT",
  "OTHER",
];

const TYPE_LABEL: Partial<Record<DocType, string>> = {
  BUSINESS_PLAN: "Business Plan",
  MARKET_REPORT: "Market Report",
  VALUE_PROPOSITION: "Value Proposition",
  SALES_PITCH: "Pitch Deck",
};

function resolveDocType(raw: string): DocType {
  if (VALID_TYPES.includes(raw as DocType)) return raw as DocType;
  const map: Record<string, DocType> = {
    "Business Plan": "BUSINESS_PLAN",
    "Market Report": "MARKET_REPORT",
    "Value Proposition": "VALUE_PROPOSITION",
    "Pitch Deck": "SALES_PITCH",
  };
  return map[raw] ?? "OTHER";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    await ensureVentureOwner(ventureId, userId);

    const documents = await prisma.document.findMany({
      where: { ventureId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        isAIGenerated: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(documents);
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ownerId: userId },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const docType = resolveDocType(String(body?.type ?? "OTHER"));
    const label = TYPE_LABEL[docType] ?? docType.replace(/_/g, " ");
    const title = String(body?.title ?? label).trim() || label;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    const openai = new OpenAI({ apiKey });

    const context = [
      `Venture: ${venture.name}`,
      venture.description ? `Description: ${venture.description}` : "",
      `Stage: ${venture.stage}/13`,
      venture.monthlyBurn != null ? `Monthly burn (USD): ${venture.monthlyBurn}` : "",
      venture.monthlyRevenue != null ? `Monthly revenue (USD): ${venture.monthlyRevenue}` : "",
      venture.cashRunwayMonths != null ? `Cash runway (months): ${venture.cashRunwayMonths}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const instruction = `You are a business writing assistant. Produce a clear, structured ${label} for the venture below. Use markdown headings and bullet points where helpful.\n\n${context}`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Write professional business documents. Be concise but complete." },
        { role: "user", content: instruction },
      ],
      temperature: 0.7,
    });

    const content =
      completion.choices[0]?.message?.content?.trim() ??
      "(No content returned from model.)";

    const document = await prisma.document.create({
      data: {
        ventureId,
        title,
        type: docType,
        content,
        isAIGenerated: true,
        createdById: userId,
        metadata: { model } as object,
      },
    });

    return NextResponse.json(document);
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
