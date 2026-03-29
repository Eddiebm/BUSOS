import type { JourneyMilestone, VentureDNA } from "@prisma/client";
import { MilestoneWorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ValuePropositionSnapshot = {
  customer: string;
  problem: string;
  category: string;
  benefit: string;
  competitor: string;
};

export type CompetitorRowSnapshot = {
  name: string;
  pricing: string;
  strengths: string;
  weaknesses: string;
};

export type MvpFeatureSnapshot = { text: string; inMvp: boolean };

export type FinancialModelSnapshot = {
  revenuePerUser: number;
  monthlyGrowthPct: number;
  cogsPct: number;
  fixedMonthlyCosts: number;
  startingUsers: number;
};

export type FinancialSummarySnapshot = {
  yearOneRevenue: number;
  yearOneNetProfit: number;
};

export type VentureSnapshotPayload = {
  ventureName: string;
  ventureDescription: string | null;
  dna: Record<string, unknown> | null;
  team: { name: string; role: string }[];
  valueProposition: ValuePropositionSnapshot | null;
  competitors: CompetitorRowSnapshot[];
  mvpFeatures: MvpFeatureSnapshot[];
  financialModel: FinancialModelSnapshot | null;
  financialSummary: FinancialSummarySnapshot | null;
  completedMilestones: number;
  totalMilestones: number;
};

function serializeDna(dna: VentureDNA | null): Record<string, unknown> | null {
  if (!dna) return null;
  const { id, ventureId, ...rest } = dna;
  void id;
  void ventureId;
  return {
    ...rest,
    createdAt: dna.createdAt.toISOString(),
    updatedAt: dna.updatedAt.toISOString(),
  };
}

function pickLatestForType(
  milestones: Pick<JourneyMilestone, "workspaceType" | "updatedAt" | "workspaceData">[],
  type: (typeof MilestoneWorkspaceType)[keyof typeof MilestoneWorkspaceType]
): Pick<JourneyMilestone, "workspaceType" | "updatedAt" | "workspaceData"> | null {
  const list = milestones.filter((m) => m.workspaceType === type);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (a.updatedAt >= b.updatedAt ? a : b));
}

function parseValueProp(data: unknown): ValuePropositionSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  return {
    customer: String(o.customer ?? ""),
    problem: String(o.problem ?? ""),
    category: String(o.category ?? ""),
    benefit: String(o.benefit ?? ""),
    competitor: String(o.competitor ?? ""),
  };
}

function parseCompetitors(data: unknown): CompetitorRowSnapshot[] {
  if (!data || typeof data !== "object") return [];
  const raw = (data as { competitors?: unknown }).competitors;
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    if (!r || typeof r !== "object") {
      return { name: "", pricing: "", strengths: "", weaknesses: "" };
    }
    const o = r as Record<string, unknown>;
    return {
      name: String(o.name ?? ""),
      pricing: String(o.pricing ?? ""),
      strengths: String(o.strengths ?? ""),
      weaknesses: String(o.weaknesses ?? ""),
    };
  });
}

function parseMvpFeatures(data: unknown): MvpFeatureSnapshot[] {
  if (!data || typeof data !== "object") return [];
  const raw = (data as { features?: unknown }).features;
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => {
    if (typeof f === "string") return { text: f, inMvp: false };
    if (f && typeof f === "object") {
      const o = f as Record<string, unknown>;
      return { text: String(o.text ?? ""), inMvp: Boolean(o.inMvp) };
    }
    return { text: "", inMvp: false };
  });
}

function parseFinancial(data: unknown): FinancialModelSnapshot | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const starting = Number(o.startingUsers);
  return {
    revenuePerUser: Number(o.revenuePerUser) || 0,
    monthlyGrowthPct: Number(o.monthlyGrowthPct) || 0,
    cogsPct: Number(o.cogsPct) || 0,
    fixedMonthlyCosts: Number(o.fixedMonthlyCosts) || 0,
    startingUsers: starting > 0 ? starting : 100,
  };
}

function computeFinancialSummary(model: FinancialModelSnapshot): FinancialSummarySnapshot {
  let users = model.startingUsers;
  const g = model.monthlyGrowthPct / 100;
  let yearOneRevenue = 0;
  let yearOneNetProfit = 0;
  for (let m = 1; m <= 12; m++) {
    if (m > 1) users = users * (1 + g);
    const revenue = users * model.revenuePerUser;
    const cogs = revenue * (model.cogsPct / 100);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - model.fixedMonthlyCosts;
    yearOneRevenue += revenue;
    yearOneNetProfit += netProfit;
  }
  return { yearOneRevenue, yearOneNetProfit };
}

/** Aggregates venture DNA, team, milestones (latest workspace per type), and counts. */
export async function buildVentureSnapshot(ventureId: string): Promise<VentureSnapshotPayload | null> {
  const venture = await prisma.venture.findUnique({
    where: { id: ventureId },
    include: {
      dna: true,
      members: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!venture) return null;

  const milestones = await prisma.journeyMilestone.findMany({
    where: { ventureId },
    select: {
      workspaceType: true,
      updatedAt: true,
      workspaceData: true,
      completed: true,
      skipped: true,
    },
  });

  const vpM = pickLatestForType(milestones, MilestoneWorkspaceType.VALUE_PROP_BUILDER);
  const cmM = pickLatestForType(milestones, MilestoneWorkspaceType.COMPETITOR_MATRIX);
  const mvpM = pickLatestForType(milestones, MilestoneWorkspaceType.MVP_FEATURE_LIST);
  const finM = pickLatestForType(milestones, MilestoneWorkspaceType.FINANCIAL_MODELER);

  const valueProposition = vpM?.workspaceData
    ? parseValueProp(vpM.workspaceData)
    : null;
  const competitors = cmM?.workspaceData ? parseCompetitors(cmM.workspaceData) : [];
  const mvpFeatures = mvpM?.workspaceData ? parseMvpFeatures(mvpM.workspaceData) : [];
  const financialModel = finM?.workspaceData ? parseFinancial(finM.workspaceData) : null;
  const financialSummary = financialModel ? computeFinancialSummary(financialModel) : null;

  const team = venture.members.map((m) => ({
    name: m.user.name?.trim() || m.user.email,
    role: m.role,
  }));

  const completedMilestones = milestones.filter((m) => m.completed && !m.skipped).length;
  const totalMilestones = milestones.length;

  return {
    ventureName: venture.name,
    ventureDescription: venture.description ?? null,
    dna: serializeDna(venture.dna),
    team,
    valueProposition,
    competitors,
    mvpFeatures,
    financialModel,
    financialSummary,
    completedMilestones,
    totalMilestones,
  };
}

export function formatValuePropositionSentence(vp: ValuePropositionSnapshot | null): string {
  if (!vp) return "";
  const ph = (v: string, fb: string) => (v.trim() ? v.trim() : fb);
  return `For ${ph(vp.customer, "[customer]")}, who ${ph(vp.problem, "[problem]")}, our ${ph(vp.category, "[category]")} is the solution that ${ph(vp.benefit, "[benefit]")}, unlike ${ph(vp.competitor, "[competitor]")}.`;
}
