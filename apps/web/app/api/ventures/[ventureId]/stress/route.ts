import { NextResponse } from "next/server";
import { getOrCreateUserFromClerk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRead, canWrite, getVentureAccess } from "@/lib/venture-access";
import { calculateStress } from "@/lib/stress";
import OpenAI from "openai";
import { getStageName } from "@/lib/stage-names";
import { AlertType, AlertSeverity } from "@prisma/client";

const MODEL = "gpt-4.1-mini";

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
}

/**
 * Auto-generate Founder Operating System alerts based on stress factors.
 * Only creates alerts that don't already exist (deduped by type + venture).
 */
async function maybeCreateAIAlerts(
  ventureId: string,
  userId: string,
  venture: {
    name: string;
    stage: number;
    stressMode: string;
    cashRunwayMonths: number | null;
    monthlyBurn: number | null;
  },
  overdueCount: number,
  daysSince: number
) {
  const alerts: Array<{
    ventureId: string;
    userId: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    actionUrl?: string;
  }> = [];

  // Cash runway alert
  if (venture.cashRunwayMonths !== null && venture.cashRunwayMonths <= 3) {
    const existing = await prisma.alert.findFirst({
      where: {
        ventureId,
        type: "CASH_RUNWAY",
        dismissed: false,
        createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (!existing) {
      let message = `${venture.name} has ${venture.cashRunwayMonths} months of runway remaining.`;
      try {
        const client = getOpenAI();
        if (!client) throw new Error("no openai");
        const completion = await client.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are Ada. Write a single urgent but calm 2-sentence alert message for a founder whose cash runway is critically low. Be specific, actionable, and reference the actual numbers. No bullet points.",
            },
            {
              role: "user",
              content: `Venture: ${venture.name}. Stage: ${venture.stage}/13 (${getStageName(venture.stage)}). Runway: ${venture.cashRunwayMonths} months. Monthly burn: ${venture.monthlyBurn ? "$" + venture.monthlyBurn.toLocaleString() : "unknown"}. Write the alert.`,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        message =
          completion.choices[0]?.message?.content?.trim() ?? message;
      } catch {
        // use default message
      }
      alerts.push({
        ventureId,
        userId,
        type: AlertType.CASH_RUNWAY,
        severity: venture.cashRunwayMonths <= 1 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: `Runway Alert: ${venture.cashRunwayMonths} months remaining`,
        message,
        actionUrl: `/ventures/${ventureId}/settings`,
      });
    }
  }

  // Overdue roadmap milestones (due date passed)
  if (overdueCount >= 3) {
    const existing = await prisma.alert.findFirst({
      where: {
        ventureId,
        type: "TASK_OVERDUE",
        dismissed: false,
        createdAt: { gt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
    });
    if (!existing) {
      let message = `You have ${overdueCount} overdue roadmap milestones. Falling behind on execution is an early warning sign.`;
      try {
        const client = getOpenAI();
        if (!client) throw new Error("no openai");
        const completion = await client.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are Ada. Write a single direct 2-sentence alert for a founder with multiple overdue roadmap milestones. Be specific and motivating. No bullet points.",
            },
            {
              role: "user",
              content: `Venture: ${venture.name}. Stage: ${venture.stage}/13. Overdue milestones: ${overdueCount}. Mode: ${venture.stressMode}. Write the alert.`,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        message =
          completion.choices[0]?.message?.content?.trim() ?? message;
      } catch {
        // use default message
      }
      alerts.push({
        ventureId,
        userId,
        type: AlertType.TASK_OVERDUE,
        severity: overdueCount >= 5 ? AlertSeverity.WARNING : AlertSeverity.INFO,
        title: `${overdueCount} overdue milestones need attention`,
        message,
        actionUrl: `/ventures/${ventureId}/tasks`,
      });
    }
  }

  // Inactivity alert
  if (daysSince >= 7) {
    const existing = await prisma.alert.findFirst({
      where: {
        ventureId,
        type: "MILESTONE_REACHED",
        title: { contains: "inactivity" },
        dismissed: false,
        createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (!existing) {
      alerts.push({
        ventureId,
        userId,
        type: AlertType.MILESTONE_REACHED,
        severity: AlertSeverity.INFO,
        title: `${daysSince} days since last activity`,
        message: `${venture.name} hasn't had any recorded activity in ${daysSince} days. Momentum is everything at this stage — even small daily actions compound into big results.`,
        actionUrl: `/dashboard?ventureId=${ventureId}`,
      });
    }
  }

  // Create all new alerts
  if (alerts.length > 0) {
    await prisma.alert.createMany({ data: alerts });
  }
}

export async function GET(
  _request: Request,
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

    const now = new Date();
    const overdueCount = await prisma.journeyMilestone.count({
      where: {
        ventureId,
        completed: false,
        skipped: false,
        dueDate: { lt: now },
      },
    });

    const lastActivity = venture.lastActivityAt ?? venture.createdAt;
    const daysSince = Math.floor(
      (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    const { level, mode } = calculateStress(
      venture.cashRunwayMonths ?? null,
      overdueCount,
      daysSince
    );

    if (canWrite(access.role)) {
      await prisma.venture.update({
        where: { id: ventureId },
        data: { stressLevel: level, stressMode: mode },
      });
      maybeCreateAIAlerts(ventureId, userId, venture, overdueCount, daysSince).catch(
        (e) => console.error("[stress/alerts]", e)
      );
    }

    return NextResponse.json({
      stressLevel: level,
      mode,
      factors: {
        runway: venture.cashRunwayMonths ?? null,
        overdueMilestones: overdueCount,
        daysSinceLogin: daysSince,
      },
    });
  } catch (e) {
    console.error("[stress]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
