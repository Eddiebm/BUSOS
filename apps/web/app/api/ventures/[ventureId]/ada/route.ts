import { NextResponse } from "next/server";
import type { VentureDNA } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRead, canWrite, getVentureAccess } from "@/lib/venture-access";
import { checkSlidingWindowRateLimit } from "@/lib/sliding-window-rate-limit";
import OpenAI from "openai";
import { getStageName } from "@/lib/stage-names";

const MODEL = "gpt-4.1-mini";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
}

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

const ADA_SYSTEM = `You are Ada, embedded in BUSOS — the Founder Operating System for serious founders.

You are not a generic chatbot. You are a deeply invested co-founder who knows this venture's data intimately. You think like a seasoned operator who has built and scaled companies, combined with the analytical rigor of a top-tier investor.

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

const ADA_COFOUNDER_PROMPT =
  "You have access to this founder's VentureDNA — their founding story, their dream, their why. Reference it specifically and often. When they're struggling, remind them of their dream. When they're making decisions, connect them back to their original problem statement. This is what makes you Ada, not a generic chatbot.";

const JSON_OUTPUT_INSTRUCTION = `Respond with ONLY a JSON object (no markdown) of this shape:
{"message":"your proactive insight in plain prose","reasoning":["Because ...","Given ...","Risk identified: ...","Your experience as ..."]}
The "reasoning" array must have 2-4 short strings. Each string should start with "Because", "Given", "Risk identified:", or "Your". Be specific to this founder's data.`;

function parseMessageAndReasoning(
  content: string
): { message: string; reasoning: string[] } {
  try {
    const parsed = JSON.parse(content) as { message?: string; reasoning?: unknown };
    const message = String(parsed.message ?? "").trim();
    const reasoning = Array.isArray(parsed.reasoning)
      ? parsed.reasoning.map((r) => String(r).trim()).filter(Boolean)
      : [];
    if (message) return { message, reasoning };
  } catch {
    /* fall through */
  }
  return { message: content.trim(), reasoning: [] };
}

function dnaContextLines(dna: VentureDNA): string[] {
  return [
    "--- FOUNDING STORY ---",
    `Dream: ${dna.dreamStatement}`,
    `Problem being solved: ${dna.problemStatement}`,
    ...(dna.targetCustomer ? [`Target customer: ${dna.targetCustomer}`] : []),
    ...(dna.whyNow ? [`Why now: ${dna.whyNow}`] : []),
    `Founder's why: ${dna.founderWhy}`,
    ...(dna.unfairAdvantage ? [`Unfair advantage: ${dna.unfairAdvantage}`] : []),
    ...(dna.founderBackground ? [`Founder background: ${dna.founderBackground}`] : []),
    `Founder experience: ${dna.founderExperience}`,
    ...(dna.hoursPerWeek != null ? [`Hours/week available: ${dna.hoursPerWeek}`] : []),
    ...(dna.capitalAvailable ? [`Capital: ${dna.capitalAvailable}`] : []),
    "--- END FOUNDING STORY ---",
  ];
}

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
  dna?: VentureDNA | null;
}): string {
  const now = new Date();
  const open = venture.tasks.filter((t) => !t.completed);
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < now);
  const stageFocus = STAGE_FOCUS[venture.stage] ?? `Stage ${venture.stage}`;

  const lines: Array<string | null> = [
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
  ];

  if (venture.dna) {
    lines.push(...dnaContextLines(venture.dna));
  }

  return lines.filter(Boolean).join("\n");
}

/**
 * GET — Proactive Ada message, context-aware and GPT-powered (includes VentureDNA when present).
 */
export async function GET(
  _req: Request,
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

    const rl = checkSlidingWindowRateLimit(`ada:${userId}`, 40, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      include: {
        dna: true,
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

    if (!venture) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        text: "Ada is temporarily unavailable (OpenAI is not configured). Check back soon.",
        message: "Ada is temporarily unavailable (OpenAI is not configured). Check back soon.",
        reasoning: [] as string[],
        tone: "encouraging" as const,
        suggestions: [] as Array<{ label: string; action: string }>,
      });
    }

    const context = buildContext(venture);
    const stageName = getStageName(venture.stage);

    const systemWithDna = `${ADA_SYSTEM}\n\n${ADA_COFOUNDER_PROMPT}\n\n${JSON_OUTPUT_INSTRUCTION}`;

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemWithDna },
        {
          role: "user",
          content: `Venture context:\n${context}\n\nThis founder is at Stage ${venture.stage}/13 (${stageName}) in ${venture.stressMode} mode. Give them your most important, specific, actionable insight right now. Reference their actual data and founding story when VentureDNA is present.`,
        },
      ],
      max_tokens: 400,
      temperature: 0.75,
    });

    const rawContent =
      completion.choices[0]?.message?.content?.trim() ??
      `{"message":"I'm analyzing your venture. Ask me anything.","reasoning":[]}`;
    const { message: text, reasoning } = parseMessageAndReasoning(rawContent);

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
      message: text,
      reasoning,
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
      message:
        "I'm here and ready to help. Tell me what's on your mind or ask me anything about your venture.",
      reasoning: [] as string[],
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

    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canWrite(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rl = checkSlidingWindowRateLimit(`ada-chat:${userId}`, 60, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const userMessage = String(body?.message ?? "").trim();
    if (!userMessage) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      include: {
        dna: true,
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

    if (!venture) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI not configured",
          reply: "Ada is temporarily unavailable. Please try again later.",
          message: "Ada is temporarily unavailable. Please try again later.",
          reasoning: [] as string[],
        },
        { status: 503 }
      );
    }

    const history = await prisma.chatMessage.findMany({
      where: { ventureId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const context = buildContext(venture);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `${ADA_SYSTEM}\n\n${ADA_COFOUNDER_PROMPT}\n\n${JSON_OUTPUT_INSTRUCTION}\n\nCurrent venture context:\n${context}`,
      },
      ...history.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages,
      max_tokens: 550,
      temperature: 0.75,
    });

    const rawAssistant =
      completion.choices[0]?.message?.content?.trim() ??
      `{"message":"I'm here to help. Could you rephrase that?","reasoning":[]}`;
    const { message: reply, reasoning } = parseMessageAndReasoning(rawAssistant);

    await prisma.chatMessage.createMany({
      data: [
        { ventureId, userId, role: "user", content: userMessage },
        { ventureId, userId, role: "assistant", content: reply },
      ],
    });

    await prisma.venture.update({
      where: { id: ventureId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ reply, message: reply, reasoning });
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

    const access = await getVentureAccess(ventureId, userId);
    if (!access)
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    if (!canRead(access.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
    });
    if (!venture) return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });

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
