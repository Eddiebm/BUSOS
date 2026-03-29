import Link from "next/link";
import { notFound } from "next/navigation";

const VALID_KITS = ["bridge-financing", "pivot-canvas", "cost-reduction"] as const;
type Kit = (typeof VALID_KITS)[number];

function isKit(s: string): s is Kit {
  return (VALID_KITS as readonly string[]).includes(s);
}

const CONTENT: Record<
  Kit,
  { title: string; intro: string; sections: Array<{ heading: string; body: string[] }> }
> = {
  "bridge-financing": {
    title: "Bridge financing plan",
    intro:
      "When runway is short, clarity beats optimism. Use this page to structure a bridge round or short-term financing before you talk to investors or lenders.",
    sections: [
      {
        heading: "1. Know your numbers",
        body: [
          "Months of runway left (from Settings) and monthly burn.",
          "Minimum cash needed to reach the next milestone (e.g. revenue, PMF signal, or fundraise close).",
          "Dilution you can accept — write a lower and upper bound before negotiations.",
        ],
      },
      {
        heading: "2. Choose an instrument",
        body: [
          "SAFE or convertible note — fast, common for bridges; align cap/discount with your next round expectations.",
          "Venture debt — if you have revenue and assets; usually needs proof of repayment.",
          "Revenue-based financing — if you have predictable MRR.",
        ],
      },
      {
        heading: "3. Investor outreach (this week)",
        body: [
          "List 15 people who already know your space: angels, micro-VCs, strategic angels.",
          "One paragraph email: problem, traction, ask amount, use of funds, runway extension in months.",
          "Book 5 calls; follow up in 48 hours.",
        ],
      },
      {
        heading: "4. Tie it to the product",
        body: [
          "Update runway and burn in Settings so Ada and your alerts stay accurate.",
          "Link bridge milestones to concrete deliverables (e.g. “10 paying customers”) in your Journey roadmap.",
        ],
      },
    ],
  },
  "pivot-canvas": {
    title: "Pivot canvas",
    intro:
      "Use this when the market is telling you the current wedge is wrong. Answer honestly — a pivot is a strategy change, not a failure.",
    sections: [
      {
        heading: "Problem",
        body: [
          "Who exactly has the pain (segment, geography, role)?",
          "What do they do today without you (workarounds, competitors)?",
        ],
      },
      {
        heading: "Evidence",
        body: [
          "List 5 conversations that contradicted your hypothesis.",
          "What metric would prove the new direction (activation, retention, willingness to pay)?",
        ],
      },
      {
        heading: "New hypothesis",
        body: [
          "In one sentence: new customer, new problem, or new solution?",
          "What can you ship in 2 weeks to test it?",
        ],
      },
      {
        heading: "Kill criteria",
        body: [
          "If after N conversations / M weeks you do not see X, you stop or narrow again.",
          "Write N, M, and X before you build.",
        ],
      },
      {
        heading: "Resources",
        body: [
          "Align your journey milestones with the new focus; defer or skip work that no longer matters.",
          "Update Dream Intake if your story materially changed so your roadmap regenerates correctly.",
        ],
      },
    ],
  },
  "cost-reduction": {
    title: "Cost reduction checklist",
    intro:
      "Cut in this order: non-essential spend first, people last. Quick wins fund runway without destroying execution.",
    sections: [
      {
        heading: "Software & tools (often 5–15% fast savings)",
        body: [
          "Audit all recurring SaaS; cancel duplicates and unused seats.",
          "Downgrade plans until usage justifies tier.",
          "Negotiate annual vs monthly where it lowers total cost.",
        ],
      },
      {
        heading: "Marketing & growth",
        body: [
          "Pause channels with unclear CAC or no conversion in 30 days.",
          "Keep only one experiment at a time until it wins or loses.",
        ],
      },
      {
        heading: "People & contractors",
        body: [
          "Freeze hiring except roles tied to revenue or survival.",
          "Reduce contractor hours before full-time cuts; document scope changes.",
        ],
      },
      {
        heading: "Office & ops",
        body: [
          "Remote-first where possible; sublease or reduce space.",
          "Payment terms with vendors: ask for 30→60 day terms if cash is tight.",
        ],
      },
      {
        heading: "Track impact",
        body: [
          "After each cut, update monthly burn in Settings.",
          "Add a calendar reminder to revisit your cost baseline in 14 days so spend does not creep back.",
        ],
      },
    ],
  },
};

export default function EmergencyKitPage({
  params,
}: {
  params: { ventureId: string; kit: string };
}) {
  const { ventureId, kit } = params;
  if (!isKit(kit)) notFound();

  const page = CONTENT[kit];

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="mb-8">
        <Link
          href={`/dashboard?ventureId=${ventureId}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to dashboard
        </Link>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Survival · Emergency kit</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{page.title}</h1>
      <p className="mt-3 text-slate-600">{page.intro}</p>

      <div className="mt-10 space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {section.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-200 pt-8">
        <Link
          href={`/ventures/${ventureId}/settings`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Update runway & burn
        </Link>
        <Link
          href={`/ventures/${ventureId}/tasks`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Focused roadmap
        </Link>
        <Link
          href={`/ventures/${ventureId}/journey`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Journey roadmap
        </Link>
      </div>
    </div>
  );
}
