import { NextResponse } from "next/server";
import { DocType } from "@prisma/client";
import OpenAI from "openai";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ventureAccessibleByUser } from "@/lib/venture-access";
import { requireVentureWriter } from "@/lib/venture-guard";

async function ensureVentureMember(ventureId: string, userId: string) {
  const v = await prisma.venture.findFirst({
    where: { id: ventureId, ...ventureAccessibleByUser(userId) },
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
    await ensureVentureMember(ventureId, userId);

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
    const gate = await requireVentureWriter(ventureId, userId);
    if (!gate.ok) return gate.response;

    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ...ventureAccessibleByUser(userId) },
      include: { dna: true },
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
    const openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });

    const dna = venture.dna;
    const context = [
      `Venture: ${venture.name}`,
      venture.description ? `Description: ${venture.description}` : "",
      `Stage: ${venture.stage}/13`,
      `Stress mode: ${venture.stressMode}`,
      venture.monthlyBurn != null ? `Monthly burn (USD): ${venture.monthlyBurn}` : "",
      venture.monthlyRevenue != null ? `Monthly revenue (USD): ${venture.monthlyRevenue}` : "",
      venture.cashRunwayMonths != null ? `Cash runway (months): ${venture.cashRunwayMonths}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const dnaBlock = dna
      ? [
          "",
          "Venture DNA (founder intake):",
          `Dream: ${dna.dreamStatement}`,
          `Problem: ${dna.problemStatement}`,
          dna.targetCustomer ? `Target customer: ${dna.targetCustomer}` : "",
          dna.whyNow ? `Why now: ${dna.whyNow}` : "",
          dna.unfairAdvantage ? `Unfair advantage: ${dna.unfairAdvantage}` : "",
          dna.marketSize ? `Market / TAM notes: ${dna.marketSize}` : "",
          dna.founderWhy ? `Founder why: ${dna.founderWhy}` : "",
          dna.industryVertical ? `Industry vertical: ${dna.industryVertical}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "\n(No Venture DNA on file — infer carefully from venture name and description.)";

    const isPitchDeck = docType === "SALES_PITCH";

    const instruction = isPitchDeck
      ? `You are Ada's pitch strategist inside BUSOS. Produce a **12-slide investor pitch deck** as markdown.

Rules:
- Use exactly **12** top-level headings in order: \`## Slide 1\` … \`## Slide 12\`.
- Each slide must have a short title after the number and 2–5 tight bullets (or one short paragraph for Slide 1).
- Ground every slide in the venture context and Venture DNA below. Use "TBD" only where data is truly unknown.
- Slide titles (use these themes; adapt wording to the company):
  Slide 1 — Title & tagline
  Slide 2 — Problem
  Slide 3 — Solution / product
  Slide 4 — Why now
  Slide 5 — Market opportunity
  Slide 6 — Business model
  Slide 7 — Traction & metrics
  Slide 8 — Competition & differentiation
  Slide 9 — Go-to-market
  Slide 10 — Team
  Slide 11 — Financials, ask, use of funds
  Slide 12 — Vision & closing

Venture context:
${context}
${dnaBlock}`
      : `You are a business writing assistant. Produce a clear, structured ${label} for the venture below. Use markdown headings and bullet points where helpful.

${context}
${dnaBlock}`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: isPitchDeck
            ? "Write investor-grade pitch decks: specific, confident, no fluff. BUSOS founders rely on accuracy."
            : "Write professional business documents. Be concise but complete.",
        },
        { role: "user", content: instruction },
      ],
      temperature: 0.65,
      max_tokens: isPitchDeck ? 3500 : undefined,
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
        metadata: {
          model,
          ...(isPitchDeck ? { slideCount: 12, source: "funding-hub-pitch" } : {}),
        } as object,
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
