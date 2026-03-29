import type { VentureDNA } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type MilestoneSeed = { category: string; title: string; description: string };

const STANDARD_MILESTONES: MilestoneSeed[] = [
  {
    category: "VALIDATION",
    title: "Validate the problem",
    description:
      "Conduct 20+ customer discovery interviews. Document the pain, frequency, and current workarounds.",
  },
  {
    category: "VALIDATION",
    title: "Define your target customer",
    description:
      "Write a one-page customer persona: demographics, psychographics, where they spend time, what they read.",
  },
  {
    category: "VALIDATION",
    title: "Map the competitive landscape",
    description:
      "Identify 5–10 direct and indirect competitors. Understand their pricing, positioning, and weaknesses.",
  },
  {
    category: "VALIDATION",
    title: "Define your unique value proposition",
    description:
      "Write a single sentence: For [customer], who [problem], [product] is a [category] that [key benefit], unlike [competitor].",
  },
  {
    category: "VALIDATION",
    title: "Validate willingness to pay",
    description:
      "Get 10 people to say they would pay for your solution. Pre-orders, LOIs, or paid pilots count.",
  },
  {
    category: "PRODUCT",
    title: "Define your MVP",
    description: "Scope the minimum feature set that delivers the core value. Cut everything else.",
  },
  {
    category: "PRODUCT",
    title: "Build or prototype your MVP",
    description: "Ship something. It can be ugly. It needs to work.",
  },
  {
    category: "PRODUCT",
    title: "Get your first 10 users",
    description: "Find 10 people who aren't your friends or family to use your product.",
  },
  {
    category: "PRODUCT",
    title: "Establish a feedback loop",
    description: "Set up a weekly process to collect, analyze, and act on user feedback.",
  },
  {
    category: "PRODUCT",
    title: "Find product-market fit signal",
    description:
      "Identify the metric that proves users would be devastated if your product disappeared.",
  },
  {
    category: "LEGAL",
    title: "Choose your business structure",
    description:
      "Decide: LLC, C-Corp, or other. For VC-backed startups, Delaware C-Corp is standard.",
  },
  {
    category: "LEGAL",
    title: "Incorporate your entity",
    description:
      "File your articles of incorporation or organization. Use a service like Stripe Atlas, Clerky, or a local attorney.",
  },
  {
    category: "LEGAL",
    title: "Set up a business bank account",
    description: "Separate personal and business finances from day one. This is non-negotiable.",
  },
  {
    category: "LEGAL",
    title: "Draft founder agreements",
    description:
      "If you have co-founders, document equity splits, vesting schedules, and IP assignment in writing.",
  },
  {
    category: "LEGAL",
    title: "Set up basic contracts",
    description:
      "Create standard NDA, consulting agreement, and terms of service templates.",
  },
  {
    category: "FINANCIAL",
    title: "Build a 12-month financial model",
    description:
      "Project revenue, costs, and cash flow. Know your burn rate and runway at all times.",
  },
  {
    category: "FINANCIAL",
    title: "Set up accounting software",
    description: "Use QuickBooks, Xero, or similar. Start clean from day one.",
  },
  {
    category: "FINANCIAL",
    title: "Define your unit economics",
    description: "Know your CAC, LTV, and gross margin. These are the numbers that matter.",
  },
  {
    category: "FINANCIAL",
    title: "Establish your pricing model",
    description:
      "Test at least two pricing strategies. Don't underprice — it's harder to raise prices later.",
  },
  {
    category: "GROWTH",
    title: "Identify your primary acquisition channel",
    description:
      "Find one repeatable, scalable way to acquire customers. Focus on this exclusively until it works.",
  },
  {
    category: "GROWTH",
    title: "Build your first marketing asset",
    description: "Landing page, demo video, or pitch deck — something you can send to prospects.",
  },
  {
    category: "GROWTH",
    title: "Get your first paying customer",
    description: "Revenue changes everything. Get to $1 in revenue as fast as possible.",
  },
  {
    category: "GROWTH",
    title: "Reach $1,000 MRR",
    description: "Prove the business model works at small scale before scaling.",
  },
];

const PATENT_IP: MilestoneSeed[] = [
  {
    category: "IP",
    title: "Document your invention",
    description:
      "Write a detailed technical description of your invention with diagrams. Date and sign it. This establishes prior art.",
  },
  {
    category: "IP",
    title: "File a provisional patent application",
    description:
      "A provisional patent gives you 12 months of 'patent pending' status for ~$320 (USPTO fee). Consult a patent attorney.",
  },
  {
    category: "IP",
    title: "Conduct a freedom-to-operate search",
    description: "Verify you're not infringing existing patents before commercializing.",
  },
  {
    category: "IP",
    title: "File a non-provisional patent application",
    description: "Within 12 months of the provisional, file the full patent application.",
  },
];

const TRADEMARK_IP: MilestoneSeed[] = [
  {
    category: "IP",
    title: "Conduct a trademark clearance search",
    description:
      "Search USPTO TESS database and common law sources before investing in your brand.",
  },
  {
    category: "IP",
    title: "File your trademark application",
    description:
      "File with the USPTO (or relevant national office). Use an attorney for best results. ~$250–$350 per class.",
  },
  {
    category: "IP",
    title: "Monitor your trademark",
    description: "Set up Google Alerts and watch services to catch infringement early.",
  },
];

/**
 * Regenerates AI journey milestones from DNA: removes incomplete milestones, then creates the standard set.
 */
export async function generateJourneyMilestones(
  ventureId: string,
  _dna: VentureDNA
): Promise<void> {
  await prisma.journeyMilestone.deleteMany({
    where: { ventureId, completed: false },
  });

  const seeds: MilestoneSeed[] = [...STANDARD_MILESTONES];
  if (_dna.hasPatentableIP) seeds.push(...PATENT_IP);
  if (_dna.hasTrademarkNeeds) seeds.push(...TRADEMARK_IP);

  const data = seeds.map((m, i) => ({
    ventureId,
    category: m.category,
    title: m.title,
    description: m.description,
    order: i + 1,
    aiGenerated: true,
  }));

  if (data.length > 0) {
    await prisma.journeyMilestone.createMany({ data });
  }
}
