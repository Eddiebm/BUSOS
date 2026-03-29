/** Pre-built library for `/learn` — seeded when DB is empty. */
export const LEARN_ARTICLES_SEED: Array<{
  title: string;
  slug: string;
  category: string;
  content: string;
}> = [
  {
    slug: "customer-interview",
    category: "Product",
    title: "How to Run a Great Customer Interview",
    content:
      "## Before\n- Hypothesis in one sentence.\n- Recruit 8–12 people who match your ICP.\n\n## During\n- Ask for stories, not opinions.\n- Silence is OK — let them think.\n\n## After\n- Synthesize patterns; avoid hero quotes.",
  },
  {
    slug: "saas-metrics-cac-ltv-churn",
    category: "Finance",
    title: "Understanding SaaS Metrics: CAC, LTV, Churn",
    content:
      "## CAC\nCost to acquire one paying customer.\n\n## LTV\nExpected gross profit from a customer over their lifetime.\n\n## Rule of thumb\nLTV/CAC > 3 and payback < 12 months for healthy SMB SaaS (varies by segment).",
  },
  {
    slug: "first-hire",
    category: "People",
    title: "Guide to Your First Hire",
    content:
      "## When\nAfter repeatable work is eating founder time.\n\n## Who\nGeneralist who ships; culture fit matters more than résumé polish.\n\n## How\nClear 90-day outcomes; equity band with advisor help.",
  },
  {
    slug: "cold-email-reply",
    category: "Sales",
    title: "How to Write a Cold Email That Gets a Reply",
    content:
      "## Structure\n1) Specific relevance\n2) One insight or compliment\n3) Single ask\n\n## Avoid\nMass mail merge noise; long paragraphs.",
  },
  {
    slug: "term-sheet-basics",
    category: "Fundraising",
    title: "Understanding a Term Sheet",
    content:
      "## Economics\nValuation, option pool, liquidation preference.\n\n## Governance\nBoard seats, protective provisions.\n\n## Always\nLawyer review before you sign.",
  },
  {
    slug: "board-meeting",
    category: "Governance",
    title: "How to Run a Board Meeting",
    content:
      "## Agenda\nSend 48h early: metrics, decisions needed, appendices.\n\n## Cadence\nMonthly or quarterly; time-boxed.\n\n## Output\nWritten minutes + action owners.",
  },
  {
    slug: "sales-process-from-scratch",
    category: "Sales",
    title: "Building a Sales Process from Scratch",
    content:
      "## Stages\nLead → qualified → demo → proposal → closed.\n\n## Definitions\nExit criteria per stage.\n\n## Tooling\nLightweight CRM; don’t over-build on day one.",
  },
  {
    slug: "pricing-your-product",
    category: "Product",
    title: "How to Price Your Product",
    content:
      "## Value metric\nAlign price to how customers capture value.\n\n## Tests\nGrandfather early adopters; iterate quarterly.\n\n## Watch\nDiscounts train the market.",
  },
  {
    slug: "press-release",
    category: "Marketing",
    title: "Writing a Press Release",
    content:
      "## Format\nHeadline, subhead, quote, boilerplate.\n\n## Distribution\nNewswire + founder networks; niche beats spray-and-pray.",
  },
  {
    slug: "equity-dilution",
    category: "Fundraising",
    title: "Understanding Equity and Dilution",
    content:
      "## Dilution\nYour % shrinks when new shares are issued.\n\n## Option pool\nOften carved from pre-money — model it.\n\n## Pro forma\nCap table before/after each round.",
  },
  {
    slug: "financial-model-basics",
    category: "Finance",
    title: "How to Build a Financial Model",
    content:
      "## Drivers\nRevenue (price × quantity), COGS, Opex.\n\n## Scenarios\nBase, upside, downside.\n\n## Sanity\nCompare to comparables in your vertical.",
  },
  {
    slug: "customer-discovery-questions",
    category: "Product",
    title: "Customer Discovery: 10 Questions to Ask",
    content:
      "1. Walk me through last time this problem hurt.\n2. What did you try?\n3. What would “must-have” look like?\n…\n10. Who else should I talk to?",
  },
  {
    slug: "find-cofounder",
    category: "People",
    title: "How to Find a Co-Founder",
    content:
      "## Where\nCommunities, alumni, operators you’ve shipped with.\n\n## Vesting\n4yr with 1yr cliff standard.\n\n## Paper\nIP assignment + roles early.",
  },
  {
    slug: "first-marketing-funnel",
    category: "Marketing",
    title: "Building Your First Marketing Funnel",
    content:
      "## Funnel\nAwareness → consideration → conversion.\n\n## One channel\nOwn it before diversifying.\n\n## Measure\nUTMs + weekly review.",
  },
  {
    slug: "pitch-to-vcs",
    category: "Fundraising",
    title: "How to Pitch to VCs",
    content:
      "## Story\nWhy you, why now, why big.\n\n## Traction\nLeading indicators > vanity metrics.\n\n## Ask\nRound size + 18–24 month milestones.",
  },
];
