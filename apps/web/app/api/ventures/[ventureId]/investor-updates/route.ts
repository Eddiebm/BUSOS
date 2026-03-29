import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWrite, getVentureAccess } from "@/lib/venture-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rows = await prisma.investorUpdate.findMany({
      where: { ventureId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[investor-updates/GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
    const access = await getVentureAccess(ventureId, userId);
    if (!access || !canWrite(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as {
      title?: string;
      body?: string;
      adaAssist?: boolean;
    };
    const title = String(body.title ?? "").trim();
    let text = String(body.body ?? "").trim();
    if (!title || !text) return NextResponse.json({ error: "title and body required" }, { status: 400 });

    if (body.adaAssist && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Ada. Restructure the founder's investor update into: Highlights, Metrics, Challenges, Ask. Use markdown. Keep their voice.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.5,
      });
      text = completion.choices[0]?.message?.content?.trim() ?? text;
    }

    const u = await prisma.investorUpdate.create({
      data: { ventureId, title, body: text },
    });
    return NextResponse.json(u);
  } catch (e) {
    console.error("[investor-updates/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
