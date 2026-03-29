import type { VentureDNA } from "@prisma/client";

export const LEAN_CANVAS_BLOCK_KEYS = [
  "problem",
  "solution",
  "uniqueValueProposition",
  "unfairAdvantage",
  "customerSegments",
  "existingAlternatives",
  "keyMetrics",
  "channels",
  "costStructure",
  "revenueStreams",
] as const;

export type LeanCanvasBlockKey = (typeof LEAN_CANVAS_BLOCK_KEYS)[number];

export type LeanCanvasBlocks = Record<LeanCanvasBlockKey, string>;

export const LEAN_CANVAS_LABELS: Record<LeanCanvasBlockKey, string> = {
  problem: "Problem",
  solution: "Solution",
  uniqueValueProposition: "Unique value proposition",
  unfairAdvantage: "Unfair advantage",
  customerSegments: "Customer segments",
  existingAlternatives: "Existing alternatives",
  keyMetrics: "Key metrics",
  channels: "Channels",
  costStructure: "Cost structure",
  revenueStreams: "Revenue streams",
};

export function emptyBlocks(): LeanCanvasBlocks {
  return Object.fromEntries(LEAN_CANVAS_BLOCK_KEYS.map((k) => [k, ""])) as LeanCanvasBlocks;
}

type VentureSeed = {
  description?: string | null;
  monthlyBurn?: number | null;
  monthlyRevenue?: number | null;
  cashRunwayMonths?: number | null;
};

/** Prefill from Venture + VentureDNA — does not persist until the user saves. */
export function seedBlocksFromVenture(venture: VentureSeed, dna: VentureDNA | null): LeanCanvasBlocks {
  const b = emptyBlocks();
  b.problem = dna?.problemStatement?.trim() ?? "";
  b.solution = venture.description?.trim() ?? "";
  const uvpParts = [dna?.dreamStatement?.trim(), dna?.whyNow?.trim()].filter(Boolean);
  b.uniqueValueProposition = uvpParts.join("\n\n");
  b.unfairAdvantage = dna?.unfairAdvantage?.trim() ?? "";
  b.customerSegments = dna?.targetCustomer?.trim() ?? "";
  b.existingAlternatives = dna?.industryVertical
    ? `Industry / context: ${dna.industryVertical}`
    : "";
  b.keyMetrics = "";
  b.channels = "";
  const costLines: string[] = [];
  if (venture.monthlyBurn != null) costLines.push(`Monthly burn: ${venture.monthlyBurn}`);
  if (venture.cashRunwayMonths != null) costLines.push(`Cash runway (months): ${venture.cashRunwayMonths}`);
  b.costStructure = costLines.join("\n");
  const revLines: string[] = [];
  if (venture.monthlyRevenue != null) revLines.push(`Monthly revenue: ${venture.monthlyRevenue}`);
  b.revenueStreams = revLines.join("\n");
  return b;
}

export function normalizeBlocks(raw: unknown): LeanCanvasBlocks {
  const b = emptyBlocks();
  if (!raw || typeof raw !== "object") return b;
  const o = raw as Record<string, unknown>;
  for (const k of LEAN_CANVAS_BLOCK_KEYS) {
    const v = o[k];
    if (typeof v === "string") b[k] = v;
  }
  return b;
}

export function mergeBlocks(base: LeanCanvasBlocks, patch: Partial<LeanCanvasBlocks>): LeanCanvasBlocks {
  const out = { ...base };
  for (const k of LEAN_CANVAS_BLOCK_KEYS) {
    if (patch[k] !== undefined) out[k] = patch[k] ?? "";
  }
  return out;
}

/** Markdown export for sharing or version control outside BUSOS. */
export function formatLeanCanvasMarkdown(
  blocks: LeanCanvasBlocks,
  options?: { ventureName?: string; exportedAt?: Date }
): string {
  const at = options?.exportedAt ?? new Date();
  const title = options?.ventureName?.trim()
    ? `Lean Canvas — ${options.ventureName.trim()}`
    : "Lean Canvas";
  const lines: string[] = [
    `# ${title}`,
    "",
    `*Exported from BUSOS on ${at.toISOString().slice(0, 10)} (${at.toLocaleString()} local).*`,
    "",
  ];
  for (const k of LEAN_CANVAS_BLOCK_KEYS) {
    lines.push(`## ${LEAN_CANVAS_LABELS[k]}`, "", blocks[k].trim() || "_—_", "", "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function normalizePartialPatch(raw: unknown): Partial<LeanCanvasBlocks> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const patch: Partial<LeanCanvasBlocks> = {};
  for (const k of LEAN_CANVAS_BLOCK_KEYS) {
    if (k in o && o[k] !== undefined) {
      patch[k] = typeof o[k] === "string" ? o[k] : String(o[k] ?? "");
    }
  }
  return patch;
}
