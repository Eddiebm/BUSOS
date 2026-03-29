import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import OpenAI from "openai";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MODEL = "gpt-4.1-mini";

type BlueOceanAnalysis = {
  executiveSummary: string;
  uncontestedSpace: string;
  strategicOpportunities: string[];
  risksToValidate: string[];
  suggestedExperiments: string[];
};

const SYSTEM = `You are a strategy analyst for BUSOS (Founder Operating System). Perform a concise Blue Ocean-style scan: help the founder see differentiation and uncontested demand space — not generic advice.
Respond ONLY with valid JSON matching the schema. Be specific to this venture's name, stage, and DNA when provided.`;

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
}

async function ensureVentureOwner(ventureId: string, userId: string) {
  const v = await prisma.venture.findFirst({
    where: { id: ventureId, ownerId: userId },
    include: { dna: true },
  });
  if (!v) throw new Error("NOT_FOUND");
  return v;
}

/**
 * GET — Past Blue Ocean scans for this venture (newest first).
 */
export async function GET(
  _request: Request,
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

    const scans = await prisma.blueOceanScan.findMany({
      where: { ventureId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        jobId: true,
        analysis: true,
        createdAt: true,
      },
    });

    return NextResponse.json(scans);
  } catch (e) {
    console.error("[blue-ocean/GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST — Run a Blue Ocean scan and persist the result.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await ensureVentureOwner(ventureId, userId);

    const jobId = `blue_${Date.now()}_${ventureId}`;
    const dna = venture.dna;

    const contextParts = [
      `Venture: ${venture.name}`,
      venture.description ? `Description: ${venture.description}` : null,
      `Stage: ${venture.stage}/13`,
      `Stress mode: ${venture.stressMode}`,
      venture.cashRunwayMonths != null ? `Runway (months): ${venture.cashRunwayMonths}` : null,
      dna
        ? [
            `Dream: ${dna.dreamStatement}`,
            `Problem: ${dna.problemStatement}`,
            dna.targetCustomer ? `Target customer: ${dna.targetCustomer}` : null,
            dna.whyNow ? `Why now: ${dna.whyNow}` : null,
            dna.unfairAdvantage ? `Unfair advantage: ${dna.unfairAdvantage}` : null,
          ]
            .filter(Boolean)
            .join("\n")
        : "No VentureDNA yet — infer carefully from venture name/description only.",
    ]
      .filter(Boolean)
      .join("\n");

    const client = getOpenAI();
    if (!client) {
      return NextResponse.json(
        {
          jobId,
          status: "failed" as const,
          error: "OPENAI_API_KEY is not configured",
          analysis: null,
        },
        { status: 503 }
      );
    }

    const completion = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Context:\n${contextParts}\n\nReturn JSON:
{
  "executiveSummary": "2-3 sentences",
  "uncontestedSpace": "1 paragraph on where they could compete with less head-on rivalry",
  "strategicOpportunities": ["3-5 short bullets"],
  "risksToValidate": ["3-5 short bullets — assumptions that could sink the thesis"],
  "suggestedExperiments": ["3-5 cheap tests for the next 30 days"]
}`,
        },
      ],
      max_tokens: 900,
      temperature: 0.65,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: BlueOceanAnalysis;
    try {
      parsed = JSON.parse(raw) as BlueOceanAnalysis;
    } catch {
      return NextResponse.json(
        { jobId, status: "failed" as const, error: "Invalid model output", analysis: null },
        { status: 502 }
      );
    }

    const analysis: BlueOceanAnalysis = {
      executiveSummary: String(parsed.executiveSummary ?? "").trim() || "Analysis incomplete.",
      uncontestedSpace: String(parsed.uncontestedSpace ?? "").trim(),
      strategicOpportunities: Array.isArray(parsed.strategicOpportunities)
        ? parsed.strategicOpportunities.map((s) => String(s).trim()).filter(Boolean)
        : [],
      risksToValidate: Array.isArray(parsed.risksToValidate)
        ? parsed.risksToValidate.map((s) => String(s).trim()).filter(Boolean)
        : [],
      suggestedExperiments: Array.isArray(parsed.suggestedExperiments)
        ? parsed.suggestedExperiments.map((s) => String(s).trim()).filter(Boolean)
        : [],
    };

    const saved = await prisma.blueOceanScan.create({
      data: {
        ventureId,
        userId,
        jobId,
        analysis: analysis as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      id: saved.id,
      jobId,
      status: "completed" as const,
      completedAt: saved.createdAt.toISOString(),
      analysis,
    });
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("[blue-ocean/POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
