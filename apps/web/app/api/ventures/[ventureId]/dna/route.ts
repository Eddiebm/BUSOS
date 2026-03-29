import { NextResponse } from "next/server";
import type { FounderExperience } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ventureAccessibleByUser } from "@/lib/venture-access";
import { requireVentureWriter } from "@/lib/venture-guard";
import { generateJourneyMilestones } from "@/lib/journey";

async function getVentureForMember(ventureId: string, userId: string) {
  return prisma.venture.findFirst({
    where: { id: ventureId, ...ventureAccessibleByUser(userId) },
  });
}

const FOUNDER_VALUES: FounderExperience[] = ["FIRST_TIME", "REPEAT", "SERIAL"];

function parseFounderExperience(v: unknown): FounderExperience {
  const s = String(v ?? "FIRST_TIME");
  return FOUNDER_VALUES.includes(s as FounderExperience)
    ? (s as FounderExperience)
    : "FIRST_TIME";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ventureId } = await params;
    const venture = await getVentureForMember(ventureId, userId);
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const dna = await prisma.ventureDNA.findUnique({
      where: { ventureId },
    });
    return NextResponse.json(dna);
  } catch (e) {
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

    const venture = await getVentureForMember(ventureId, userId);
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;

    const dreamStatement = String(body.dreamStatement ?? "").trim();
    const problemStatement = String(body.problemStatement ?? "").trim();
    const founderWhy = String(body.founderWhy ?? "").trim();
    if (!dreamStatement || !problemStatement || !founderWhy) {
      return NextResponse.json(
        { error: "dreamStatement, problemStatement, and founderWhy are required" },
        { status: 400 }
      );
    }

    const dna = await prisma.ventureDNA.upsert({
      where: { ventureId },
      create: {
        ventureId,
        dreamStatement,
        problemStatement,
        targetCustomer: body.targetCustomer ? String(body.targetCustomer).trim() : null,
        whyNow: body.whyNow ? String(body.whyNow).trim() : null,
        marketSize: body.marketSize ? String(body.marketSize).trim() : null,
        founderWhy,
        unfairAdvantage: body.unfairAdvantage ? String(body.unfairAdvantage).trim() : null,
        founderBackground: body.founderBackground ? String(body.founderBackground).trim() : null,
        founderExperience: parseFounderExperience(body.founderExperience),
        coFounders: body.coFounders ? String(body.coFounders).trim() : null,
        location: body.location ? String(body.location).trim() : null,
        hoursPerWeek:
          body.hoursPerWeek === undefined || body.hoursPerWeek === null
            ? null
            : Number(body.hoursPerWeek),
        capitalAvailable: body.capitalAvailable ? String(body.capitalAvailable).trim() : null,
        teamSize:
          body.teamSize === undefined || body.teamSize === null
            ? 1
            : Number(body.teamSize) || 1,
        hasPatentableIP: Boolean(body.hasPatentableIP),
        hasTrademarkNeeds: Boolean(body.hasTrademarkNeeds),
        industryVertical: body.industryVertical ? String(body.industryVertical).trim() : null,
      },
      update: {
        dreamStatement,
        problemStatement,
        targetCustomer: body.targetCustomer ? String(body.targetCustomer).trim() : null,
        whyNow: body.whyNow ? String(body.whyNow).trim() : null,
        marketSize: body.marketSize ? String(body.marketSize).trim() : null,
        founderWhy,
        unfairAdvantage: body.unfairAdvantage ? String(body.unfairAdvantage).trim() : null,
        founderBackground: body.founderBackground ? String(body.founderBackground).trim() : null,
        founderExperience: parseFounderExperience(body.founderExperience),
        coFounders: body.coFounders ? String(body.coFounders).trim() : null,
        location: body.location ? String(body.location).trim() : null,
        hoursPerWeek:
          body.hoursPerWeek === undefined || body.hoursPerWeek === null
            ? null
            : Number(body.hoursPerWeek),
        capitalAvailable: body.capitalAvailable ? String(body.capitalAvailable).trim() : null,
        teamSize:
          body.teamSize === undefined || body.teamSize === null
            ? 1
            : Number(body.teamSize) || 1,
        hasPatentableIP: Boolean(body.hasPatentableIP),
        hasTrademarkNeeds: Boolean(body.hasTrademarkNeeds),
        industryVertical: body.industryVertical ? String(body.industryVertical).trim() : null,
      },
    });

    await generateJourneyMilestones(ventureId, dna);
    return NextResponse.json(dna);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
