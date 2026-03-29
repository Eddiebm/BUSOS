"use client";

import { useParams } from "next/navigation";
import { Brain, CheckCircle2, XCircle, MinusCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

type Category =
  | "AI Co-Founder"
  | "Startup OS"
  | "Methodology"
  | "Fundraising"
  | "Productivity";

interface Competitor {
  name: string;
  url: string;
  tagline: string;
  description: string;
  pricing: string;
  category: Category;
  strengths: string[];
  weaknesses: string[];
}

const COMPETITORS: Competitor[] = [
  // ── AI Co-Founder ──────────────────────────
  {
    name: "ZigZag",
    url: "https://gozigzag.com",
    tagline: "AI Copilot from Idea to Investment-Ready",
    description:
      "Generates a lean canvas, validation surveys, brand assets, website, MVP requirements, and investor data room from a single sentence description.",
    pricing: "Free / $8 / $16 per month",
    category: "AI Co-Founder",
    strengths: [
      "Fast asset generation — idea to pitch deck in minutes",
      "Low price point, accessible to bootstrapped founders",
      "No-signup demo lowers friction",
    ],
    weaknesses: [
      "No ongoing journey guidance — stops after asset creation",
      "Does not explain why tasks matter or what order to do them",
      "No persistent memory or venture DNA",
      "No emotional support or stress-aware mode",
    ],
  },
  {
    name: "Cofounder.co",
    url: "https://cofounder.co",
    tagline: "Never use a flow builder again",
    description:
      "AI agents that plug into your existing tools (Notion, Slack, etc.) and automate repetitive workflows using natural language. Credit-based pricing.",
    pricing: "Free (3,000 credits) / $39.99/mo (4,000 credits)",
    category: "AI Co-Founder",
    strengths: [
      "Powerful workflow automation across existing tools",
      "Natural language interface — no technical setup",
      "Integrates with 50+ platforms",
    ],
    weaknesses: [
      "Assumes the founder already knows what to do — no guided journey",
      "Credit-based pricing gets expensive quickly",
      "Not startup-specific — general automation tool",
      "No roadmap, no milestone tracking, no Ada-style advisor",
    ],
  },
  {
    name: "AICofounder.com",
    url: "https://aicofounder.com",
    tagline: "Your Zero-Equity AI Partner",
    description:
      "Generates business plans, pitch decks, and development specifications. Positioned as a document generation tool for early-stage founders.",
    pricing: "Subscription (approx. $29–$99/mo)",
    category: "AI Co-Founder",
    strengths: [
      "Quick document generation for plans and decks",
      "Low cost entry point",
    ],
    weaknesses: [
      "Output is static — no ongoing journey or memory",
      "No task guidance, no milestone tracking",
      "Generic output not personalized to venture DNA",
    ],
  },

  // ── Startup OS ─────────────────────────────
  {
    name: "CofounderOS",
    url: "https://cofounderos.com",
    tagline: "The Operating System for Entrepreneurship Programs",
    description:
      "B2B platform sold to accelerators, ESOs, and funders to manage startup programs, track impact, and connect founders to capital. Over 2,000 startups evaluated.",
    pricing: "B2B enterprise pricing (demo required)",
    category: "Startup OS",
    strengths: [
      "Strong institutional adoption by accelerators and ESOs",
      "Robust program management and impact tracking",
      "Connects founders to capital through partner network",
    ],
    weaknesses: [
      "NOT for individual founders — sold to organizations, not entrepreneurs",
      "No AI co-founder or personalized guidance",
      "Founders are passive participants, not the paying customer",
    ],
  },
  {
    name: "StartupOS",
    url: "https://startupos.com",
    tagline: "Take the guesswork out of fundraising",
    description:
      "Fundraising-focused platform with investor matching, data rooms, and expert services. Charges hourly for advisory services.",
    pricing: "Services from $80/hr",
    category: "Startup OS",
    strengths: [
      "Strong investor network and fundraising focus",
      "Expert human advisors available",
    ],
    weaknesses: [
      "Expensive — $80/hr is inaccessible for most first-time founders",
      "Narrow focus on fundraising only",
      "No AI, no journey guidance, no task management",
    ],
  },

  // ── Methodology ────────────────────────────
  {
    name: "LEANSTACK",
    url: "https://leanstack.com",
    tagline: "Life's Too Short to Build Something Nobody Wants",
    description:
      "Tools, training, and AI for founders from Ash Maurya, creator of Lean Canvas. Used by over 1 million entrepreneurs. Focuses on business model validation.",
    pricing: "Free tools + paid courses/coaching",
    category: "Methodology",
    strengths: [
      "Trusted brand — Ash Maurya is a respected thought leader",
      "Lean Canvas used by 1M+ entrepreneurs worldwide",
      "Strong methodology for business model validation",
    ],
    weaknesses: [
      "Framework-only — no personalized journey or task guidance",
      "Requires the founder to already understand the methodology",
      "No AI co-founder, no memory, no stress-aware support",
      "Primarily educational, not operational",
    ],
  },
  {
    name: "Strategyzer",
    url: "https://strategyzer.com",
    tagline: "Strategy & Growth Tools for Business Teams",
    description:
      "Creator of the Business Model Canvas and Value Proposition Canvas. Used by 200,000+ companies. Primarily targets corporate innovation teams and consultants.",
    pricing: "Platform from ~$40/mo; enterprise licensing available",
    category: "Methodology",
    strengths: [
      "Gold standard frameworks used by Fortune 500 companies",
      "Excellent for business model design and testing",
      "Strong educational content",
    ],
    weaknesses: [
      "Corporate and consultant focus — not designed for first-time founders",
      "No AI guidance or personalized roadmap",
      "Overwhelming for solo founders without business training",
    ],
  },

  // ── Fundraising ────────────────────────────
  {
    name: "Visible.vc",
    url: "https://visible.vc",
    tagline: "Investor Relationship Hub for Best-in-Class Founders",
    description:
      "Investor CRM, data rooms, stakeholder reporting, and fundraising pipeline management. Trusted by thousands of startups for managing investor relations.",
    pricing: "Free / $49 / $99 per month",
    category: "Fundraising",
    strengths: [
      "Best-in-class investor CRM and data room",
      "Clean UI, founder-friendly",
      "Strong investor database and pipeline tools",
    ],
    weaknesses: [
      "Single-purpose — only useful once you're actively fundraising",
      "No journey guidance, no task management, no AI advisor",
      "Irrelevant for pre-fundraising founders",
    ],
  },
  {
    name: "Foundersuite",
    url: "https://foundersuite.com",
    tagline: "A Better Way to Raise Capital",
    description:
      "Fundraising intelligence platform trusted by 100,000+ startups. Provides investor database, CRM, and pitch tools.",
    pricing: "Freemium + paid tiers",
    category: "Fundraising",
    strengths: [
      "Large investor database (100K+ startups use it)",
      "Solid CRM for managing investor outreach",
    ],
    weaknesses: [
      "Fundraising-only — no broader startup OS",
      "No AI, no journey, no task guidance",
    ],
  },

  // ── Productivity ───────────────────────────
  {
    name: "Notion",
    url: "https://notion.so",
    tagline: "The All-in-One Workspace",
    description:
      "Flexible workspace used by many founders to build their own startup OS using templates. Infinitely customizable but requires significant setup.",
    pricing: "Free / $10 / $15 per user per month",
    category: "Productivity",
    strengths: [
      "Infinitely flexible — can be anything you need",
      "Large template library including startup templates",
      "Affordable and widely adopted",
    ],
    weaknesses: [
      "Requires the founder to build everything from scratch",
      "No startup-specific guidance, no AI co-founder",
      "Blank canvas is overwhelming for first-time founders",
      "No understanding of your venture DNA or context",
    ],
  },
  {
    name: "ClickUp",
    url: "https://clickup.com",
    tagline: "One App to Replace Them All",
    description:
      "Powerful project management platform with startup templates. Used by many early-stage teams for task and project tracking.",
    pricing: "Free / $7 / $12 per user per month",
    category: "Productivity",
    strengths: [
      "Powerful task and project management",
      "Startup templates available",
      "Good for team collaboration",
    ],
    weaknesses: [
      "Generic — no startup-specific context or guidance",
      "No AI co-founder, no venture DNA, no roadmap generation",
      "Steep learning curve for solo founders",
    ],
  },
];

/* ─────────────────────────────────────────────
   FEATURE COMPARISON DATA
───────────────────────────────────────────── */

type FeatureValue = "yes" | "no" | "partial" | string;

interface FeatureRow {
  feature: string;
  busos: FeatureValue;
  zigzag: FeatureValue;
  cofounder: FeatureValue;
  leanstack: FeatureValue;
  visible: FeatureValue;
  notion: FeatureValue;
}

const FEATURE_ROWS: FeatureRow[] = [
  { feature: "AI-generated personalized roadmap", busos: "yes", zigzag: "partial", cofounder: "no", leanstack: "partial", visible: "no", notion: "no" },
  { feature: "Explains WHY each task matters", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "partial", visible: "no", notion: "no" },
  { feature: "Explains HOW to complete each task", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "partial", visible: "no", notion: "no" },
  { feature: "Time estimate per task", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "no", visible: "no", notion: "no" },
  { feature: "Skip / Defer tasks with consequences shown", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "no", visible: "no", notion: "partial" },
  { feature: "Voice-to-idea intake", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "no", visible: "no", notion: "no" },
  { feature: "Stress mode / emotional support", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "no", visible: "no", notion: "no" },
  { feature: "Blue Ocean competitive scan", busos: "yes", zigzag: "no", cofounder: "no", leanstack: "no", visible: "no", notion: "no" },
  { feature: "Document vault / data room", busos: "yes", zigzag: "yes", cofounder: "no", leanstack: "no", visible: "yes", notion: "partial" },
  { feature: "Business model canvas", busos: "partial", zigzag: "yes", cofounder: "no", leanstack: "yes", visible: "no", notion: "partial" },
  { feature: "Investor CRM", busos: "no", zigzag: "no", cofounder: "no", leanstack: "no", visible: "yes", notion: "partial" },
  { feature: "Persistent venture memory (DNA)", busos: "yes", zigzag: "no", cofounder: "partial", leanstack: "no", visible: "no", notion: "no" },
  { feature: "Monthly pricing (approx.)", busos: "TBD", zigzag: "$0–$16", cofounder: "$0–$40", leanstack: "Free+", visible: "$0–$99", notion: "$0–$15" },
];

/* ─────────────────────────────────────────────
   CATEGORY CONFIG
───────────────────────────────────────────── */

const CATEGORY_STYLES: Record<Category, string> = {
  "AI Co-Founder": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Startup OS": "bg-blue-50 text-blue-700 border-blue-200",
  "Methodology": "bg-amber-50 text-amber-700 border-amber-200",
  "Fundraising": "bg-green-50 text-green-700 border-green-200",
  "Productivity": "bg-slate-50 text-slate-700 border-slate-200",
};

const CATEGORIES: Category[] = [
  "AI Co-Founder",
  "Startup OS",
  "Methodology",
  "Fundraising",
  "Productivity",
];

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function FeatureIcon({ value }: { value: FeatureValue | string }) {
  if (value === "yes") return <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />;
  if (value === "no") return <XCircle className="mx-auto h-5 w-5 text-slate-300" />;
  if (value === "partial") return <MinusCircle className="mx-auto h-5 w-5 text-amber-400" />;
  return <span className="block text-center text-xs text-slate-500">{value}</span>;
}

function CompetitorCard({ c }: { c: Competitor }) {
  const badgeClass = CATEGORY_STYLES[c.category];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-indigo-600 transition-colors"
              aria-label={`Visit ${c.name}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 italic">{c.tagline}</p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold", badgeClass)}>
          {c.category}
        </span>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{c.description}</p>

      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Pricing: </span>{c.pricing}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-green-700">Strengths</p>
          <ul className="space-y-1">
            {c.strengths.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-red-600">Weaknesses</p>
          <ul className="space-y-1">
            {c.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function IntelligencePage() {
  useParams(); // keep ventureId in scope for future API calls

  return (
    <div className="space-y-12 pb-16">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Competitive Intelligence</h1>
          <p className="mt-1 text-slate-600">Where BUSOS stands in the market — and why it wins.</p>
        </div>
      </div>

      {/* ── Section 1: Positioning ── */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Where We Stand</h2>
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
          <p className="text-base leading-relaxed text-indigo-950">
            <strong>BUSOS is the only platform that combines a personalized AI co-founder (Ada) with a full operating system for the founder journey</strong> — explaining not just <em>what</em> to do, but <em>why</em> it matters, <em>why</em> now, <em>how</em> to do it, and <em>where</em> to go.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-indigo-800">
            Every competitor either generates assets (ZigZag), automates tasks (Cofounder.co), teaches frameworks (LEANSTACK), or manages fundraising (Visible.vc). BUSOS does all of this within a single, guided, memory-aware journey built specifically for first-time entrepreneurs — the 300 million people who start a business each year without a mentor, a co-founder, or an MBA.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Competitors analyzed", value: "10+" },
              { label: "Unique features", value: "5+" },
              { label: "Target market", value: "First-time founders" },
              { label: "Core advantage", value: "Ada's guided journey" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-indigo-100 bg-white p-3 text-center">
                <p className="text-lg font-bold text-indigo-700">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Competitor Cards ── */}
      <section>
        <h2 className="mb-6 text-xl font-bold text-slate-900">The Landscape</h2>
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const list = COMPETITORS.filter((c) => c.category === cat);
            if (list.length === 0) return null;
            const badgeClass = CATEGORY_STYLES[cat];
            return (
              <div key={cat}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide", badgeClass)}>
                    {cat}
                  </span>
                  <span className="text-xs text-slate-400">{list.length} competitor{list.length > 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {list.map((c) => (
                    <CompetitorCard key={c.name} c={c} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: Feature Comparison Table ── */}
      <section>
        <h2 className="mb-2 text-xl font-bold text-slate-900">Feature Comparison</h2>
        <p className="mb-5 text-sm text-slate-500">BUSOS vs. the most relevant competitors across key founder-facing features.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 w-52">Feature</th>
                <th className="px-3 py-3 text-center font-bold text-indigo-700 bg-indigo-50">BUSOS</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-600">ZigZag</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-600">Cofounder.co</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-600">LEANSTACK</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-600">Visible.vc</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-600">Notion</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  className={cn(
                    "border-b border-slate-100 transition-colors hover:bg-slate-50",
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  )}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.feature}</td>
                  <td className="px-3 py-3 bg-indigo-50/50"><FeatureIcon value={row.busos} /></td>
                  <td className="px-3 py-3"><FeatureIcon value={row.zigzag} /></td>
                  <td className="px-3 py-3"><FeatureIcon value={row.cofounder} /></td>
                  <td className="px-3 py-3"><FeatureIcon value={row.leanstack} /></td>
                  <td className="px-3 py-3"><FeatureIcon value={row.visible} /></td>
                  <td className="px-3 py-3"><FeatureIcon value={row.notion} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Full support</span>
          <span className="flex items-center gap-1"><MinusCircle className="h-3.5 w-3.5 text-amber-400" /> Partial support</span>
          <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-slate-300" /> Not supported</span>
        </div>
      </section>

      {/* Footer */}
      <p className="text-xs text-slate-400 text-right">Last updated: March 2026 · Based on publicly available information</p>
    </div>
  );
}
