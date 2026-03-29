import { NextResponse } from "next/server";
import OpenAI from "openai";

const MODEL = "gpt-4.1-mini";

export type DemoPayload = {
  problem: string;
  hoursPerWeek: number;
  capitalAvailable: string;
  founderExperience: string;
};

type DemoMilestone = { title: string; description: string; category: string };

type DemoJson = {
  adaResponse: string;
  milestones: DemoMilestone[];
};

const DEMO_SYSTEM = `You are Ada inside BUSOS — the Founder Operating System.
You are responding to a founder who has not yet signed up. They described their situation below.
Your job is to demonstrate in 3-4 sentences that you understand their specific situation.
Be specific to their problem. Do not be generic. Identify their single biggest risk given their hours and capital.
Give one concrete next action. Be honest, direct, and encouraging.
After your response, generate exactly 7 milestone objects with title, one-line description, and category (one of: VALIDATION, PRODUCT, LEGAL, FINANCIAL, GROWTH).
Return ONLY valid JSON with this exact shape:
{"adaResponse":"string","milestones":[{"title":"string","description":"string","category":"VALIDATION"}]}`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DemoPayload>;
    const problem = String(body.problem ?? "").trim();
    const hoursPerWeek = Number(body.hoursPerWeek);
    const capitalAvailable = String(body.capitalAvailable ?? "").trim();
    const founderExperience = String(body.founderExperience ?? "").trim();

    if (!problem || !Number.isFinite(hoursPerWeek) || !capitalAvailable || !founderExperience) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
    const userMsg = `Problem: ${problem}\nHours per week: ${hoursPerWeek}\nCapital: ${capitalAvailable}\nExperience: ${founderExperience}`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DEMO_SYSTEM },
        { role: "user", content: userMsg },
      ],
      max_tokens: 900,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: DemoJson;
    try {
      parsed = JSON.parse(raw) as DemoJson;
    } catch {
      return NextResponse.json({ error: "Could not parse Ada response" }, { status: 502 });
    }

    if (!parsed.adaResponse || !Array.isArray(parsed.milestones)) {
      return NextResponse.json({ error: "Invalid response shape" }, { status: 502 });
    }

    const milestones = parsed.milestones.slice(0, 7).map((m, i) => ({
      step: i + 1,
      title: String(m.title ?? "").trim() || `Step ${i + 1}`,
      description: String(m.description ?? "").trim(),
      category: String(m.category ?? "VALIDATION").trim().toUpperCase(),
    }));

    return NextResponse.json({
      adaResponse: String(parsed.adaResponse).trim(),
      milestones,
    });
  } catch (e) {
    console.error("[demo/POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
