import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { getStageName } from "@/lib/stage-names";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// gpt-4o-mini: fast, capable, cost-effective
const MODEL = "gpt-4o-mini";

const STAGE_FOCUS: Record<number, string> = {
  1: "Problem Discovery — validate the pain point is real and worth solving",
  2: "Customer Research — talk to 20+ potential customers this week",
  3: "Problem Definition — articulate the problem in one crisp sentence",
  4: "Solution Hypothesis — sketch the simplest possible solution",
  5: "MVP Scoping — cut scope until it hurts, then cut more",
  6: "MVP Build — ship something ugly that works",
  7: "First Users — get 10 people using it who aren't your friends",
  8: "Feedback Loop — iterate weekly based on real user behavior",
  9: "Product-Market Fit — find the signal that users would be devastated if you shut down",
  10: "Growth Channels — find one repeatable, scalable acquisition channel",
  11: "Unit Economics — prove the business model works at small scale",
  12: "Scale — hire, systematize, and accelerate what's working",
  13: "Expansion — new markets, products, or geographies",
};

const ADA_SYSTEM = `You are Ada, the AI co-founder embedded in BUSOS — an entrepreneur operating system for serious founders.

You are not a generic assistant. You are a deeply invested co-founder who knows this venture's data intimately. You think like a seasoned operator who has built and scaled companies, combined with the analytical rigor of a top-tier investor.

Your voice:
- Direct, specific, and grounded in the founder's actual data
- Warm but honest — you will tell them hard truths kindly
- Proactive — you notice what they're missing, not just what they asked
- Never generic — every response references their specific venture, stage, and numbers
- Conversational prose only — no bullet points, no headers, no lists in responses
- Proactive messages: 3-5 sentences. Chat responses: up to 8 sentences.

Stress modes:
- DISCOVERY: Finding product-market fit. Prioritize learning speed and customer conversations.
- EXECUTION: PMF found, now building. Prioritize shipping velocity and team leverage.
- SURVIVAL: Cash or growth crisis. Prioritize extending runway and finding revenue immediately.`;

function buildContext(venture: {
  name: string;
  description?: string | null;
  stage: number;
  stressMode: string;
  stressLevel: number;
  cashRunwayMonths?: number | null;
  monthlyBurn?: number | null;
  monthlyRevenue?: number | null;
  tasks: Array<{ title: string; dueDate?: Date | null; completed: boolean }>;
  alerts?: Array<{ message: string; read: boolean }>;
}): string {
  const now = new Date();
  const open = venture.tasks.filter((t) => !t.completed);
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < now);
  const stageFocus = STAGE_FOCUS[venture.stage] ?? `Stage ${venture.stage}`;

  return [
    `Venture: ${venture.name}`,
    venture.description ? `What it does: ${venture.description}` : null,
    `Stage: ${venture.stage}/13 — ${stageFocus}`,
    `Stress mode: ${venture.stressMode} | Stress level: ${venture.stressLevel}%`,
    venture.cashRunwayMonths != null
      ? `Cash runway: ${venture.cashRunwayMonths} months`
      : "Cash runway: not entered",
    venture.monthlyBurn ? `Monthly burn: $${venture.monthlyBurn.toLocaleString()}` : null,
    venture.monthlyRevenue
      ? `Monthly revenue: $${venture.monthlyRevenue.toLocaleString()}`
      : "Monthly revenue: $0 or not entered",
    open.length > 0
      ? `Open tasks (${open.length}): ${open.slice(0, 8).map((t) => t.title).join("; ")}`
      : "No open tasks",
    overdue.length > 0
      ? `OVERDUE (${overdue.length}): ${overdue.map((t) => t.title).join("; ")}`
      : null,
    venture.alerts && venture.alerts.filter((a) => !a.read).length > 0
      ? `Active alerts: ${venture.alerts
          .filter((a) => !a.read)
          .slice(0, 3)
          .map((a) => a.message)
          .join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * GET — Proactive Ada message, context-aware and GPT-powered.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;

    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ownerId: userId },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 15,
          select: { title: true, dueDate: true, completed: true },
        },
        alerts: {
          where: { read: false, dismissed: false },
          take: 5,
          select: { message: true, read: true },
        },
      },
    });

    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const context = buildContext(venture);
    const stageName = getStageName(venture.stage);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: ADA_SYSTEM },
        {
          role: "user",
          content: `Venture context:\n${context}\n\nThis founder is at Stage ${venture.stage}/13 (${stageName}) in ${venture.stressMode} mode. Give them your most important, specific, actionable insight right now. Reference their actual data.`,
        },
      ],
      max_tokens: 220,
      temperature: 0.75,
    });

    const text =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm analyzing your venture. Ask me anything.";

    const base = `/ventures/${ventureId}`;
    const suggestions: Array<{ label: string; action: string }> = [];

    if (venture.stressMode === "SURVIVAL") {
      suggestions.push(
        { label: "Update runway", action: `${base}/settings` },
        { label: "Review tasks", action: `${base}/tasks` }
      );
    } else if (venture.stressMode === "EXECUTION") {
      suggestions.push(
        { label: "View tasks", action: `${base}/tasks` },
        { label: "Documents", action: `${base}/documents` }
      );
    } else {
      suggestions.push(
        { label: "Add a task", action: `${base}/tasks` },
        { label: "Update settings", action: `${base}/settings` }
      );
    }

    return NextResponse.json({
      text,
      tone:
        venture.stressMode === "SURVIVAL"
          ? "urgent"
          : venture.stressMode === "EXECUTION"
          ? "direct"
          : "encouraging",
      suggestions,
    });
  } catch (e) {
    console.error("[ada/GET]", e);
    return NextResponse.json({
      text: "I'm here and ready to help. Tell me what's on your mind or ask me anything about your venture.",
      tone: "encouraging",
      suggestions: [],
    });
  }
}

/**
 * POST — Chat with Ada. Persists history to DB so conversation continues across page loads.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const body = await req.json();
    const userMessage = String(body?.message ?? "").trim();
    if (!userMessage) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ownerId: userId },
      include: {
        tasks: {
          where: { completed: false },
          take: 15,
          select: { title: true, dueDate: true, completed: true },
        },
        alerts: {
          where: { read: false, dismissed: false },
          take: 5,
          select: { message: true, read: true },
        },
      },
    });

    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch last 20 messages for context window
    const history = await prisma.chatMessage.findMany({
      where: { ventureId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const context = buildContext(venture);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `${ADA_SYSTEM}\n\nCurrent venture context:\n${context}`,
      },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 450,
      temperature: 0.75,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm here to help. Could you rephrase that?";

    // Persist both messages
    await prisma.chatMessage.createMany({
      data: [
        { ventureId, userId, role: "user", content: userMessage },
        { ventureId, userId, role: "assistant", content: reply },
      ],
    });

    // Update lastActivityAt
    await prisma.venture.update({
      where: { id: ventureId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[ada/POST]", e);
    return NextResponse.json(
      { error: "Internal error", reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * PATCH — Fetch persisted chat history for a venture.
 */
export async function PATCH(
  _req: Request,
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

    const messages = await prisma.chatMessage.findMany({
      where: { ventureId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { id: true, role: true, content: true, createdAt: true },
    });

    return NextResponse.json({ messages });
  } catch (e) {
    console.error("[ada/PATCH]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
