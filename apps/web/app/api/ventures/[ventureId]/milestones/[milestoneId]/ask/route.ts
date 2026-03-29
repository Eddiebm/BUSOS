import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRead, canWrite, getVentureAccess } from "@/lib/venture-access";

const MODEL = "gpt-4.1-mini";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canRead(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const milestone = await prisma.journeyMilestone.findFirst({
      where: { id: milestoneId, ventureId },
    });
    if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rows = await prisma.milestoneConversation.findMany({
      where: { milestoneId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    const messages = [...rows].reverse();

    return NextResponse.json({ messages });
  } catch (e) {
    console.error("[milestone ask GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string; milestoneId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId, milestoneId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canWrite(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json().catch(() => ({}))) as { question?: string };
    const question = String(body?.question ?? "").trim();
    if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });

    const milestone = await prisma.journeyMilestone.findFirst({
      where: { id: milestoneId, ventureId },
    });
    if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      include: { dna: true },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const history = await prisma.milestoneConversation.findMany({
      where: { milestoneId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { role: true, content: true },
    });
    const chronological = [...history].reverse();

    const dna = venture.dna;
    const ventureContext = [
      `Venture: ${venture.name}`,
      dna?.industryVertical ? `Industry: ${dna.industryVertical}` : null,
      `Stage: ${venture.stage}/13`,
      dna?.location ? `Location: ${dna.location}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const systemPrompt = `You are Ada, the AI co-founder inside BUSOS. A founder is asking for help completing a specific task.
Task: ${milestone.title}
What it is: ${milestone.description}
How to do it: ${milestone.howToDoIt ?? "Not specified — infer from task title and description."}
Where to do it: ${milestone.whereToDoIt ?? "Not specified — suggest concrete tools or channels when relevant."}
Why it matters: ${milestone.reason ?? "Critical for de-risking this stage of the venture."}
Why this order: ${milestone.whyThisOrder ?? "Sequencing matters for dependencies and momentum."}
Venture context: ${ventureContext}

Answer the founder's question in 3-5 sentences max. Be direct, specific, and actionable. If they ask about cost, give real numbers. If they ask about alternatives, give 2-3 options. Never give generic advice.`;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...chronological.map((m) => ({
          role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
        { role: "user", content: question },
      ],
      max_tokens: 500,
      temperature: 0.65,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I couldn't generate a reply. Please try again.";

    await prisma.milestoneConversation.createMany({
      data: [
        { milestoneId, userId, role: "USER", content: question },
        { milestoneId, userId, role: "ASSISTANT", content: reply },
      ],
    });

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[milestone ask POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
