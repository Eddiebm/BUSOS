import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET: Proactive Ada message for the venture — powered by OpenAI GPT.
 */
export async function GET(
  request: Request,
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
          where: { completed: false },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { title: true, dueDate: true },
        },
      },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const overdueCount = venture.tasks.filter(
      (t: { dueDate: Date | null }) => t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const lastActivity = venture.lastActivityAt ?? venture.createdAt;
    const daysSince = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    const mode = venture.stressMode;
    const runway = venture.cashRunwayMonths ?? null;
    const pendingTasks = venture.tasks.map((t: { title: string }) => t.title).join(", ");

    // Build context for Ada
    const contextLines = [
      `Venture name: ${venture.name}`,
      venture.description ? `Description: ${venture.description}` : null,
      `Current mode: ${mode}`,
      `Stage: ${venture.stage} of 13`,
      runway !== null ? `Cash runway: ${runway} months` : "Cash runway: not set",
      venture.monthlyBurn ? `Monthly burn: $${venture.monthlyBurn}` : null,
      venture.monthlyRevenue ? `Monthly revenue: $${venture.monthlyRevenue}` : null,
      `Overdue tasks: ${overdueCount}`,
      daysSince > 0 ? `Days since last activity: ${daysSince}` : null,
      pendingTasks ? `Open tasks: ${pendingTasks}` : "No open tasks",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are Ada, an expert startup advisor embedded in the BUSOS entrepreneur operating system. 
You give concise, actionable, and empathetic advice to founders based on their venture context.
Keep responses to 2-3 sentences maximum. Be direct, specific, and encouraging.
Do not use bullet points or lists. Write in plain conversational prose.
Always address the founder's specific situation — never give generic advice.`;

    const userPrompt = `Here is the current state of this founder's venture:\n\n${contextLines}\n\nGive them your most important piece of advice right now.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";

    // Build contextual suggestions
    const suggestions: Array<{ label: string; action: string }> = [];
    if (mode === "SURVIVAL") {
      suggestions.push(
        { label: "Update runway", action: `/ventures/${ventureId}/settings` },
        { label: "View tasks", action: `/dashboard?ventureId=${ventureId}` }
      );
    } else if (mode === "EXECUTION") {
      suggestions.push(
        { label: "View tasks", action: `/dashboard?ventureId=${ventureId}` },
        { label: "Venture settings", action: `/ventures/${ventureId}/settings` }
      );
    } else {
      suggestions.push(
        { label: "Update runway", action: `/ventures/${ventureId}/settings` },
        { label: "Add tasks", action: `/dashboard?ventureId=${ventureId}` }
      );
    }

    return NextResponse.json({
      text,
      tone: mode === "SURVIVAL" ? "urgent" : mode === "EXECUTION" ? "direct" : "encouraging",
      suggestions,
    });
  } catch (e) {
    console.error("[ada]", e);
    // Fallback to static message if OpenAI fails
    return NextResponse.json({
      text: "Keep focused on your most important goal today. Small consistent actions compound into big results.",
      tone: "encouraging",
      suggestions: [],
    });
  }
}

/**
 * POST: Chat with Ada — ask a specific question about your venture.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const body = await request.json();
    const userMessage = String(body?.message ?? "").trim();
    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const venture = await prisma.venture.findFirst({
      where: { id: ventureId, ownerId: userId },
      include: {
        tasks: {
          where: { completed: false },
          take: 10,
          select: { title: true },
        },
      },
    });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contextLines = [
      `Venture name: ${venture.name}`,
      venture.description ? `Description: ${venture.description}` : null,
      `Current mode: ${venture.stressMode}`,
      `Stage: ${venture.stage} of 13`,
      venture.cashRunwayMonths !== null ? `Cash runway: ${venture.cashRunwayMonths} months` : null,
      venture.tasks.length > 0 ? `Open tasks: ${venture.tasks.map((t: { title: string }) => t.title).join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are Ada, an expert startup advisor in the BUSOS entrepreneur operating system.
You give concise, actionable, and empathetic advice to founders.
Keep responses to 3-4 sentences. Be direct and specific to their situation.
Do not use bullet points. Write in plain conversational prose.

Venture context:
${contextLines}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "I'm here to help. Could you rephrase your question?";

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[ada/chat]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
