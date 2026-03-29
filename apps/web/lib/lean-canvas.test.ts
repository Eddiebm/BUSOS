import type { VentureDNA } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  emptyBlocks,
  formatLeanCanvasMarkdown,
  mergeBlocks,
  normalizeBlocks,
  seedBlocksFromVenture,
} from "./lean-canvas";

describe("lean-canvas", () => {
  it("seedBlocksFromVenture maps DNA and venture fields", () => {
    const dna: VentureDNA = {
      id: "1",
      ventureId: "v",
      dreamStatement: "Dream big",
      problemStatement: "Pain",
      targetCustomer: "SMB",
      whyNow: "Regulation",
      marketSize: null,
      founderWhy: "Why",
      unfairAdvantage: "Network",
      founderBackground: "",
      founderExperience: "FIRST_TIME",
      coFounders: null,
      location: null,
      hoursPerWeek: null,
      capitalAvailable: null,
      teamSize: 1,
      hasPatentableIP: false,
      hasTrademarkNeeds: false,
      industryVertical: "Fintech",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const b = seedBlocksFromVenture(
      {
        description: "We build X",
        monthlyBurn: 5000,
        monthlyRevenue: 1000,
        cashRunwayMonths: 12,
      },
      dna
    );
    expect(b.problem).toBe("Pain");
    expect(b.solution).toBe("We build X");
    expect(b.uniqueValueProposition).toContain("Dream big");
    expect(b.uniqueValueProposition).toContain("Regulation");
    expect(b.unfairAdvantage).toBe("Network");
    expect(b.customerSegments).toBe("SMB");
    expect(b.existingAlternatives).toContain("Fintech");
    expect(b.costStructure).toContain("5000");
    expect(b.revenueStreams).toContain("1000");
  });

  it("mergeBlocks applies partial patch", () => {
    const base = emptyBlocks();
    base.problem = "A";
    const m = mergeBlocks(base, { channels: "Email" });
    expect(m.problem).toBe("A");
    expect(m.channels).toBe("Email");
  });

  it("normalizeBlocks strips unknown keys", () => {
    const n = normalizeBlocks({ problem: "p", extra: 1 });
    expect(n.problem).toBe("p");
    expect(n.solution).toBe("");
  });

  it("formatLeanCanvasMarkdown includes headings and venture name", () => {
    const b = emptyBlocks();
    b.problem = "Pain";
    const md = formatLeanCanvasMarkdown(b, {
      ventureName: "Acme",
      exportedAt: new Date("2026-01-15T12:00:00Z"),
    });
    expect(md).toContain("# Lean Canvas — Acme");
    expect(md).toContain("## Problem");
    expect(md).toContain("Pain");
  });
});
