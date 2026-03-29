import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVentureAccess } from "@/lib/venture-access";

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

    const venture = await prisma.venture.findUnique({ where: { id: ventureId } });
    if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const txs = await prisma.cashTransaction.findMany({
      where: { ventureId },
    });

    let balance = 0;
    let incomeM = 0;
    let expenseM = 0;
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const t of txs) {
      const amt = t.type === "INCOME" ? t.amount : -t.amount;
      balance += amt;
      if (t.date >= startMonth) {
        if (t.type === "INCOME") incomeM += t.amount;
        else expenseM += t.amount;
      }
    }

    const monthlyBurn = expenseM || venture.monthlyBurn || 0;
    const runwayMonths =
      monthlyBurn > 0 && balance > 0 ? balance / monthlyBurn : venture.cashRunwayMonths ?? null;

    return NextResponse.json({
      cashBalance: balance,
      monthlyIncome: incomeM,
      monthlyBurnRate: monthlyBurn,
      runwayMonths,
      ventureRunwayStored: venture.cashRunwayMonths,
    });
  } catch (e) {
    console.error("[financials/summary]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
