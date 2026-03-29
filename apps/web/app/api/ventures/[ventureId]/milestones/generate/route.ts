import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";
import { checkSlidingWindowRateLimit } from "@/lib/sliding-window-rate-limit";
import { auditLog } from "@/lib/audit-log";
import OpenAI from "openai";

const MODEL = "gpt-4.1-mini";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.manus.im/api/llm-proxy/v1",
  });
}

const SYSTEM_PROMPT = `You are Ada, the AI co-founder inside BUSOS — the Founder Operating System.
Your job is to generate a complete, ordered, personalized action plan for a founder based on their venture DNA.

Each task must be deeply practical and specific to THIS founder's situation — not generic startup advice.
You must think like a mentor who has helped 1,000 founders: you know what gets skipped and causes failure later.

For each milestone, provide:
- title: Short action-oriented title (e.g. "File your LLC with the state")
- description: 2-3 sentences explaining what this task is
- category: One of VALIDATION, LEGAL, FINANCIAL, PRODUCT, GROWTH, IP, OPERATIONS
- reason: Why this task exists and why it matters for THIS specific venture (2-3 sentences, personalized)
- whyThisOrder: Why this comes before/after adjacent tasks — what breaks if you do it out of order (1-2 sentences)
- timeEstimate: Realistic time estimate (e.g. "2-4 hours", "3-5 days", "1-2 weeks")
- whereToDoIt: Specific tools, websites, services, or professionals to use (e.g. "Use Stripe Atlas or your state's Secretary of State website. Cost: $0-$500.")
- howToDoIt: 3-5 concrete numbered steps a first-time founder can follow
- canSkip: true/false — whether this task can be safely deferred
- skipConsequence: What specifically breaks or becomes harder if this is skipped or deferred

Generate exactly 23 milestones covering the full journey from idea to launch:
- 4 VALIDATION milestones (customer discovery, problem validation, solution testing, pricing)
- 3 LEGAL milestones (business entity, IP protection, contracts/agreements)
- 3 FINANCIAL milestones (bank account, financial model, funding strategy)
- 5 PRODUCT milestones (MVP definition, build, test, iterate, launch)
- 3 GROWTH milestones (first customers, marketing, sales process)
- 2 OPERATIONS milestones (team/tools setup, processes)
- 3 IP milestones (trademark, patent assessment, trade secrets)

Order them in the sequence a founder should actually do them — not alphabetically or by category.
Legal and financial tasks often need to happen earlier than founders expect.

Return ONLY valid JSON with this exact shape:
{
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "category": "VALIDATION",
      "reason": "string",
      "whyThisOrder": "string",
      "timeEstimate": "string",
      "whereToDoIt": "string",
      "howToDoIt": "string",
      "canSkip": false,
      "skipConsequence": "string"
    }
  ]
}`;

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

    const rl = checkSlidingWindowRateLimit(`milestone-gen:${userId}`, 8, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many AI generations — try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const venture = await prisma.venture.findUnique({
      where: { id: ventureId },
      include: { dna: true },
    });

    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI generation is not configured" }, { status: 503 });
    }
    const openai = getOpenAI();

    const body = await request.json().catch(() => ({}));
    const regenerate = body?.regenerate === true;

    // Check if milestones already exist and regenerate is not requested
    const existing = await prisma.journeyMilestone.count({ where: { ventureId } });
    if (existing > 0 && !regenerate) {
      return NextResponse.json({ message: "Milestones already exist", count: existing });
    }

    const dna = venture.dna;
    const founderContext = dna
      ? `
Venture: ${venture.name}
Dream: ${dna.dreamStatement}
Problem: ${dna.problemStatement}
Target Customer: ${dna.targetCustomer ?? "Not specified"}
Why Now: ${dna.whyNow ?? "Not specified"}
Market Size: ${dna.marketSize ?? "Not specified"}
Founder's Why: ${dna.founderWhy}
Unfair Advantage: ${dna.unfairAdvantage ?? "Not specified"}
Founder Background: ${dna.founderBackground ?? "Not specified"}
Founder Experience: ${dna.founderExperience}
Location: ${dna.location ?? "Not specified"}
Hours Per Week Available: ${dna.hoursPerWeek ?? "Not specified"}
Capital Available: ${dna.capitalAvailable ?? "Not specified"}
Team Size: ${dna.teamSize ?? 1}
Has Patentable IP: ${dna.hasPatentableIP}
Has Trademark Needs: ${dna.hasTrademarkNeeds}
Industry: ${dna.industryVertical ?? "Not specified"}
`.trim()
      : `Venture: ${venture.name}\nDescription: ${venture.description ?? "No description provided"}`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a complete personalized action plan for this founder:\n\n${founderContext}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { milestones?: unknown[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    const milestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
    if (milestones.length === 0) {
      return NextResponse.json({ error: "AI returned no milestones" }, { status: 500 });
    }

    // Delete existing AI-generated milestones if regenerating
    if (regenerate) {
      await prisma.journeyMilestone.deleteMany({
        where: { ventureId, aiGenerated: true },
      });
    }

    // Bulk create the new milestones
    const created = await prisma.$transaction(
      milestones.map((m: unknown, i: number) => {
        const ms = m as Record<string, unknown>;
        return prisma.journeyMilestone.create({
          data: {
            ventureId,
            category: String(ms.category ?? "VALIDATION"),
            title: String(ms.title ?? ""),
            description: String(ms.description ?? ""),
            order: i + 1,
            aiGenerated: true,
            reason: String(ms.reason ?? ""),
            whyThisOrder: String(ms.whyThisOrder ?? ""),
            timeEstimate: String(ms.timeEstimate ?? ""),
            whereToDoIt: String(ms.whereToDoIt ?? ""),
            howToDoIt: String(ms.howToDoIt ?? ""),
            canSkip: Boolean(ms.canSkip ?? true),
            skipConsequence: String(ms.skipConsequence ?? ""),
          },
        });
      })
    );

    void auditLog({
      userId,
      ventureId,
      action: "MILESTONE_AI_GENERATE",
      metadata: { count: created.length, regenerate },
      request,
    });

    return NextResponse.json({ milestones: created, count: created.length });
  } catch (e) {
    console.error("milestone-generate error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
