import { NextResponse } from "next/server";
import type { CashFlowType, TransactionCategory } from "@prisma/client";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canFinance, getVentureAccess } from "@/lib/venture-access";
import { auditLog } from "@/lib/audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const userId = await getOrCreateUserFromClerk();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ventureId } = await params;
    const access = await getVentureAccess(ventureId, userId);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as TransactionCategory | null;

    const rows = await prisma.cashTransaction.findMany({
      where: {
        ventureId,
        ...(category ? { category } : {}),
      },
      orderBy: { date: "desc" },
      take: 500,
    });

    return NextResponse.json(
      rows.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        amount: t.amount,
        description: t.description,
        category: t.category,
        type: t.type,
      }))
    );
  } catch (e) {
    console.error("[transactions/GET]", e);
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
    if (!access || !canFinance(access.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      date?: string;
      amount?: number;
      description?: string;
      category?: TransactionCategory;
      type?: CashFlowType;
    };

    const date = body.date ? new Date(body.date) : new Date();
    const amount = Number(body.amount);
    const description = String(body.description ?? "").trim();
    const category = (body.category ?? "OTHER") as TransactionCategory;
    const type = (body.type ?? "EXPENSE") as CashFlowType;

    if (!Number.isFinite(amount) || amount <= 0 || !description) {
      return NextResponse.json({ error: "amount and description required" }, { status: 400 });
    }

    const t = await prisma.cashTransaction.create({
      data: {
        ventureId,
        date,
        amount,
        description,
        category,
        type,
      },
    });

    await prisma.activity.create({
      data: {
        ventureId,
        userId,
        type: "TRANSACTION_RECORDED",
        description: `${type} ${amount}: ${description}`,
      },
    });

    void auditLog({
      userId,
      ventureId,
      action: "TRANSACTION_CREATE",
      resourceType: "CashTransaction",
      resourceId: t.id,
      metadata: { amount, type, category },
      request,
    });

    return NextResponse.json({
      id: t.id,
      date: t.date.toISOString(),
      amount: t.amount,
      description: t.description,
      category: t.category,
      type: t.type,
    });
  } catch (e) {
    console.error("[transactions/POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
