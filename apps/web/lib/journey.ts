import type { VentureDNA } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type MilestoneSeed = {
  category: string;
  title: string;
  description: string;
  reason: string;
};

const STANDARD_MILESTONES: MilestoneSeed[] = [
  {
    category: "VALIDATION",
    title: "Validate the problem",
    description:
      "Conduct 20+ customer discovery interviews. Document the pain, frequency, and current workarounds.",
    reason: "Every venture starts here. Without validated pain, everything else is guesswork.",
  },
  {
    category: "VALIDATION",
    title: "Define your target customer",
    description:
      "Write a one-page customer persona: demographics, psychographics, where they spend time, what they read.",
    reason: "You cannot sell to everyone; a crisp persona keeps product and messaging aligned.",
  },
  {
    category: "VALIDATION",
    title: "Map the competitive landscape",
    description:
      "Identify 5–10 direct and indirect competitors. Understand their pricing, positioning, and weaknesses.",
    reason: "Investors and customers will compare you — you need a clear map before you position.",
  },
  {
    category: "VALIDATION",
    title: "Define your unique value proposition",
    description:
      "Write a single sentence: For [customer], who [problem], [product] is a [category] that [key benefit], unlike [competitor].",
    reason: "If you cannot state differentiation in one sentence, the market will not remember you.",
  },
  {
    category: "VALIDATION",
    title: "Validate willingness to pay",
    description:
      "Get 10 people to say they would pay for your solution. Pre-orders, LOIs, or paid pilots count.",
    reason: "Pain without willingness to pay is a hobby, not a business.",
  },
  {
    category: "PRODUCT",
    title: "Define your MVP",
    description: "Scope the minimum feature set that delivers the core value. Cut everything else.",
    reason: "Scope creep is the default failure mode; the MVP must prove one core value only.",
  },
  {
    category: "PRODUCT",
    title: "Build or prototype your MVP",
    description: "Ship something. It can be ugly. It needs to work.",
    reason: "Learning requires something real in users' hands — slides are not product.",
  },
  {
    category: "PRODUCT",
    title: "Get your first 10 users",
    description: "Find 10 people who aren't your friends or family to use your product.",
    reason: "Friendly users lie politely; strangers reveal truth.",
  },
  {
    category: "PRODUCT",
    title: "Establish a feedback loop",
    description: "Set up a weekly process to collect, analyze, and act on user feedback.",
    reason: "Without a loop, you ship in the dark and repeat the same mistakes.",
  },
  {
    category: "PRODUCT",
    title: "Find product-market fit signal",
    description:
      "Identify the metric that proves users would be devastated if your product disappeared.",
    reason: "PMF is a measurable signal, not a feeling — define it before you scale spend.",
  },
  {
    category: "LEGAL",
    title: "Choose your business structure",
    description:
      "Decide: LLC, C-Corp, or other. For VC-backed startups, Delaware C-Corp is standard.",
    reason: "Structure affects taxes, fundraising, and liability — decide early.",
  },
  {
    category: "LEGAL",
    title: "Incorporate your entity",
    description:
      "File your articles of incorporation or organization. Use a service like Stripe Atlas, Clerky, or a local attorney.",
    reason: "A legal entity separates you from personal liability and enables contracts and equity.",
  },
  {
    category: "LEGAL",
    title: "Set up a business bank account",
    description: "Separate personal and business finances from day one. This is non-negotiable.",
    reason: "Commingling funds complicates taxes, diligence, and investor trust.",
  },
  {
    category: "LEGAL",
    title: "Draft founder agreements",
    description:
      "If you have co-founders, document equity splits, vesting schedules, and IP assignment in writing.",
    reason: "Co-founder disputes destroy ventures — paper beats handshake every time.",
  },
  {
    category: "LEGAL",
    title: "Set up basic contracts",
    description:
      "Create standard NDA, consulting agreement, and terms of service templates.",
    reason: "Standard templates reduce legal friction when you move fast with partners and hires.",
  },
  {
    category: "FINANCIAL",
    title: "Build a 12-month financial model",
    description:
      "Project revenue, costs, and cash flow. Know your burn rate and runway at all times.",
    reason: "Because your capital is limited — knowing your burn rate and runway is non-negotiable.",
  },
  {
    category: "FINANCIAL",
    title: "Set up accounting software",
    description: "Use QuickBooks, Xero, or similar. Start clean from day one.",
    reason: "Retrofitting books after chaos is expensive; start clean before revenue.",
  },
  {
    category: "FINANCIAL",
    title: "Define your unit economics",
    description: "Know your CAC, LTV, and gross margin. These are the numbers that matter.",
    reason: "Scaling a broken unit economic model only burns cash faster.",
  },
  {
    category: "FINANCIAL",
    title: "Establish your pricing model",
    description:
      "Test at least two pricing strategies. Don't underprice — it's harder to raise prices later.",
    reason: "Price is a strategy lever; testing early avoids painful repricing later.",
  },
  {
    category: "GROWTH",
    title: "Identify your primary acquisition channel",
    description:
      "Find one repeatable, scalable way to acquire customers. Focus on this exclusively until it works.",
    reason: "Spraying budget across many channels usually means mastering none.",
  },
  {
    category: "GROWTH",
    title: "Build your first marketing asset",
    description: "Landing page, demo video, or pitch deck — something you can send to prospects.",
    reason: "You need a shareable artifact that explains value without you in the room.",
  },
  {
    category: "GROWTH",
    title: "Get your first paying customer",
    description: "Revenue changes everything. Get to $1 in revenue as fast as possible.",
    reason: "Payment proves value; everything before that is hypothesis.",
  },
  {
    category: "GROWTH",
    title: "Reach $1,000 MRR",
    description: "Prove the business model works at small scale before scaling.",
    reason: "Small-scale MRR proves repeatability before you pour fuel on the fire.",
  },
];

const PATENT_IP: MilestoneSeed[] = [
  {
    category: "IP",
    title: "Document your invention",
    description:
      "Write a detailed technical description of your invention with diagrams. Date and sign it. This establishes prior art.",
    reason: "Because you indicated your venture involves patentable technology or processes.",
  },
  {
    category: "IP",
    title: "File a provisional patent application",
    description:
      "A provisional patent gives you 12 months of 'patent pending' status for ~$320 (USPTO fee). Consult a patent attorney.",
    reason: "Because you indicated your venture involves patentable technology or processes.",
  },
  {
    category: "IP",
    title: "Conduct a freedom-to-operate search",
    description: "Verify you're not infringing existing patents before commercializing.",
    reason: "Because you indicated your venture involves patentable technology or processes.",
  },
  {
    category: "IP",
    title: "File a non-provisional patent application",
    description: "Within 12 months of the provisional, file the full patent application.",
    reason: "Because you indicated your venture involves patentable technology or processes.",
  },
];

const TRADEMARK_IP: MilestoneSeed[] = [
  {
    category: "IP",
    title: "Conduct a trademark clearance search",
    description:
      "Search USPTO TESS database and common law sources before investing in your brand.",
    reason: "Because you indicated your venture needs trademark protection.",
  },
  {
    category: "IP",
    title: "File your trademark application",
    description:
      "File with the USPTO (or relevant national office). Use an attorney for best results. ~$250–$350 per class.",
    reason: "Because you indicated your venture needs trademark protection.",
  },
  {
    category: "IP",
    title: "Monitor your trademark",
    description: "Set up Google Alerts and watch services to catch infringement early.",
    reason: "Because you indicated your venture needs trademark protection.",
  },
];

function applyDnaOverrides(seeds: MilestoneSeed[], dna: VentureDNA): MilestoneSeed[] {
  return seeds.map((s) => {
    if (s.title === "Draft founder agreements" && dna.coFounders?.trim()) {
      return {
        ...s,
        reason:
          "Because you have co-founders — equity and IP must be documented before you build anything.",
      };
    }
    return s;
  });
}

/**
 * Regenerates AI journey milestones from DNA: removes incomplete milestones, then creates the standard set.
 */
export async function generateJourneyMilestones(
  ventureId: string,
  dna: VentureDNA
): Promise<void> {
  await prisma.journeyMilestone.deleteMany({
    where: { ventureId, completed: false },
  });

  let seeds: MilestoneSeed[] = [...STANDARD_MILESTONES];
  if (dna.hasPatentableIP) seeds.push(...PATENT_IP);
  if (dna.hasTrademarkNeeds) seeds.push(...TRADEMARK_IP);

  seeds = applyDnaOverrides(seeds, dna);

  const data = seeds.map((m, i) => ({
    ventureId,
    category: m.category,
    title: m.title,
    description: m.description,
    reason: m.reason,
    order: i + 1,
    aiGenerated: true,
  }));

  if (data.length > 0) {
    await prisma.journeyMilestone.createMany({ data });
  }
}
