"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  ChevronRight,
  Coins,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FundingInvestor } from "@/lib/funding-investors";

type TabId = "bootstrap" | "vc" | "debt";

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "bootstrap", label: "Bootstrapping", short: "Control" },
  { id: "vc", label: "Venture Capital", short: "Speed" },
  { id: "debt", label: "Debt Financing", short: "Leverage" },
];

const VC_STAGES = [
  {
    name: "Pre-seed",
    size: "~$100K–$2M",
    expect: "Team + problem clarity; early prototype or LOIs.",
  },
  {
    name: "Seed",
    size: "~$1M–$5M",
    expect: "MVP traction, repeatable acquisition signals, clear ICP.",
  },
  {
    name: "Series A",
    size: "~$5M–$25M",
    expect: "Proven PMF, strong unit economics path, scalable GTM.",
  },
  {
    name: "Series B",
    size: "~$20M–$80M",
    expect: "Scale playbook; predictable revenue growth.",
  },
  {
    name: "Series C+",
    size: "~$50M+",
    expect: "Category leadership, M&A optionality, international expansion.",
  },
];

const VC_PROCESS = [
  "Find investors who match your stage, sector, and geography.",
  "Get a warm intro — cold email works, but trust transfers faster.",
  "Pitch with a tight narrative: problem, insight, traction, ask.",
  "Due diligence: data room, references, financial and legal review.",
  "Term sheet → definitive docs → close and wire.",
];

function HowAdaHelps({ path }: { path: "bootstrap" | "vc" | "debt" }) {
  const text: Record<typeof path, string> = {
    bootstrap:
      "Ada connects your runway, burn, and stage to whether staying bootstrapped still fits—surfacing cash-flow risks from your venture record and nudging you when the data says it may be time to add equity or debt instead of going it alone.",
    vc:
      "Ada ranks investors from local and regional programs through national US funds and international options (Africa, Europe, Asia, global). She uses your stage, stress mode, and Venture DNA so you start with the best-fit names—then you validate mandates and pursue warm intros.",
    debt:
      "Ada helps you stress-test repayment against your revenue pattern: when an SBA-backed loan, venture debt, revenue-based financing, or a revolving bank line is most aligned—and what covenants to watch given runway and stress mode.",
  };
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/10 p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">How Ada helps · this path</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{text[path]}</p>
    </section>
  );
}

export default function FundingHubPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;

  const [tab, setTab] = useState<TabId>("bootstrap");
  const [ventureName, setVentureName] = useState<string | null>(null);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investorsError, setInvestorsError] = useState<string | null>(null);
  const [investors, setInvestors] = useState<FundingInvestor[]>([]);
  const [matchSummary, setMatchSummary] = useState<string | null>(null);
  const [pitchLoading, setPitchLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/ventures/${ventureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => setVentureName(typeof v?.name === "string" ? v.name : null))
      .catch(() => setVentureName(null));
  }, [ventureId]);

  const findInvestors = useCallback(async () => {
    setInvestorsLoading(true);
    setInvestorsError(null);
    setInvestors([]);
    setMatchSummary(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/funding/find-investors`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        investors?: FundingInvestor[];
        matchSummary?: string;
        error?: string;
      };
      if (!res.ok) {
        setInvestorsError(data.error ?? "Could not load matches.");
        return;
      }
      setInvestors(data.investors ?? []);
      setMatchSummary(data.matchSummary ?? null);
      toast.success("Ada ranked investors for your venture");
    } catch {
      setInvestorsError("Network error.");
    } finally {
      setInvestorsLoading(false);
    }
  }, [ventureId]);

  const generatePitchDeck = useCallback(async () => {
    setPitchLoading(true);
    try {
      const title = ventureName ? `Pitch deck — ${ventureName}` : "Pitch deck";
      const res = await fetch(`/api/ventures/${ventureId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Pitch Deck", title }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not generate pitch deck.");
        return;
      }
      toast.success("12-slide pitch deck from Venture DNA — saved to Documents.");
      router.push(`/ventures/${ventureId}/documents`);
    } catch {
      toast.error("Network error.");
    } finally {
      setPitchLoading(false);
    }
  }, [ventureId, ventureName, router]);

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Banknote className="h-7 w-7" aria-hidden />
          <span className="text-sm font-semibold uppercase tracking-wide">Capital</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Funding Hub</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Each path below explains tradeoffs and includes <strong className="font-medium text-foreground">how Ada helps</strong> for
          that strategy. Ada recommends investor matches from a 50+ entry directory (local → international),
          and can generate a <strong className="font-medium text-foreground">12-slide pitch deck</strong> from your Venture DNA into
          Documents for{" "}
          <span className="font-medium text-foreground">{ventureName ?? "this venture"}</span>.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setTab("vc");
              void findInvestors();
            }}
            disabled={investorsLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:from-primary/90 hover:to-primary/85 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {investorsLoading ? "Ada is matching…" : "Find investors — Ada picks best fit"}
          </button>
          <button
            type="button"
            onClick={generatePitchDeck}
            disabled={pitchLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-background disabled:opacity-60"
          >
            <TrendingUp className="h-4 w-4" aria-hidden />
            {pitchLoading ? "Generating…" : "Generate 12-slide pitch deck"}
          </button>
          <Link
            href={`/ventures/${ventureId}/documents`}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-info hover:underline"
          >
            Open Documents
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Pitch decks are generated from Venture DNA + venture metrics as a 12-slide markdown deck in
          Documents. Investor picks are educational — verify fund status and geography yourself.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="mb-8 flex gap-1 rounded-xl border border-border bg-muted/80 p-1"
        role="tablist"
        aria-label="Funding types"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-3 text-center text-sm font-semibold transition",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="block">{t.label}</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{t.short}</span>
          </button>
        ))}
      </div>

      {tab === "bootstrap" && <BootstrapPanel />}
      {tab === "vc" && (
        <VentureCapitalPanel
          ventureId={ventureId}
          investors={investors}
          investorsLoading={investorsLoading}
          investorsError={investorsError}
          matchSummary={matchSummary}
          onFindInvestors={findInvestors}
        />
      )}
      {tab === "debt" && <DebtPanel />}
    </div>
  );
}

function BootstrapPanel() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold text-foreground">The Path of Control</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Bootstrapping</strong> means growing your company with your own
          savings, early customer revenue, and reinvested profits — without bringing in outside equity
          investors. You trade dilution and board dynamics for speed of decision-making and ownership.
        </p>
      </section>

      <HowAdaHelps path="bootstrap" />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-success/35 bg-success/10/80 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-success">
            <TrendingUp className="h-5 w-5" aria-hidden />
            Pros
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-success/90">
            <li>
              <strong>100% ownership</strong> — no equity given away to outsiders.
            </li>
            <li>
              <strong>Full control</strong> — you set strategy without investor consent for every move.
            </li>
            <li>
              <strong>Forced discipline</strong> — revenue must cover costs, which sharpens product and
              sales.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
            <Building2 className="h-5 w-5" aria-hidden />
            Cons
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-destructive/90">
            <li>
              <strong>Slower growth</strong> — less fuel for hiring and marketing vs. a funded peer.
            </li>
            <li>
              <strong>Personal financial risk</strong> — founders often reinvest savings or take reduced
              pay.
            </li>
            <li>
              <strong>Competitive pressure</strong> — well-funded rivals may outspend you in the same
              market.
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/35 bg-primary/8/60 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          Ada&apos;s advice · cash flow &amp; when to switch
        </h3>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-foreground/90">
          <li>
            <strong>Cash flow first</strong> — track runway weekly; defer non-essential spend until
            revenue repeats.
          </li>
          <li>
            <strong>Revenue before scale</strong> — land customers who pay real money; their feedback beats
            hypothetical personas.
          </li>
          <li>
            <strong>Unit economics</strong> — know what one customer costs to acquire and what they pay
            back in 12 months.
          </li>
          <li>
            <strong>When to leave bootstrap</strong> — consider equity when a clear, large opportunity
            needs capital you can&apos;t self-fund without stalling the business.
          </li>
        </ul>
      </section>
    </div>
  );
}

function VentureCapitalPanel({
  ventureId,
  investors,
  investorsLoading,
  investorsError,
  matchSummary,
  onFindInvestors,
}: {
  ventureId: string;
  investors: FundingInvestor[];
  investorsLoading: boolean;
  investorsError: string | null;
  matchSummary: string | null;
  onFindInvestors: () => void;
}) {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold text-foreground">The Path of Speed</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Venture capital</strong> means trading minority ownership for
          institutional capital to grow faster than organic cash flow would allow. Investors expect
          outsized returns and usually board rights; in exchange you get capital, networks, and pressure
          to scale.
        </p>
      </section>

      <HowAdaHelps path="vc" />

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stage timeline</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Typical ranges are illustrative; actual rounds vary widely by sector and year.
        </p>
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="flex min-w-[640px] gap-2">
            {VC_STAGES.map((s, i) => (
              <div
                key={s.name}
                className="flex min-w-[120px] flex-1 flex-col rounded-xl border border-primary/30 bg-primary/10 p-4"
              >
                <span className="text-xs font-medium text-primary">Step {i + 1}</span>
                <span className="mt-1 font-bold text-foreground">{s.name}</span>
                <span className="mt-2 text-sm font-semibold text-foreground">{s.size}</span>
                <p className="mt-2 text-xs leading-snug text-muted-foreground">{s.expect}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          From first meeting to close
        </h3>
        <ol className="mt-4 space-y-3">
          {VC_PROCESS.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/15 p-6">
        <h3 className="text-lg font-bold text-foreground">AI investor matching</h3>
        <p className="mt-2 text-sm text-foreground/80">
          50+ investors and programs with <strong className="font-semibold text-foreground">Local</strong>,{" "}
          <strong className="font-semibold text-foreground">Regional</strong>,{" "}
          <strong className="font-semibold text-foreground">National</strong>, and{" "}
          <strong className="font-semibold text-foreground">International</strong> reach — Ada recommends the best
          fit for your venture using stage, stress mode, and Venture DNA.
        </p>
        <button
          type="button"
          onClick={onFindInvestors}
          disabled={investorsLoading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:from-primary/90 hover:to-primary/85 disabled:opacity-60 sm:w-auto"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {investorsLoading ? "Ada is finding matches…" : "Find investors for my venture"}
          <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
        </button>
      </section>

      {investorsError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {investorsError}
        </div>
      )}

      {matchSummary && (
        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
          <strong className="text-foreground">Ada:</strong> {matchSummary}
        </div>
      )}

      {investors.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ada&apos;s top picks for your venture
          </h3>
          <ul className="mt-4 space-y-3">
            {investors.map((inv) => (
              <li
                key={`${inv.name}-${inv.website}`}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground">{inv.name}</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Tag>{inv.type}</Tag>
                      <Tag>{inv.location}</Tag>
                      <Tag>{inv.scope}</Tag>
                    </div>
                  </div>
                  <a
                    href={inv.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-info hover:underline"
                  >
                    Website
                  </a>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{inv.thesis}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">Check:</strong> {inv.checkSize}
                  </span>
                  <span>
                    <strong className="text-foreground">Stage:</strong> {inv.stage}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Directory ID: {ventureId.slice(0, 8)}… — for education only, not investment advice.
      </p>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

function DebtPanel() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold text-foreground">The Path of Leverage</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Debt financing</strong> means borrowing money you agree to
          repay with interest — through government-backed programs, specialized venture lenders,
          revenue-based structures, or bank facilities. You keep more equity than a priced equity round,
          but you add repayment obligations, covenants, and sometimes guarantees.
        </p>
      </section>

      <HowAdaHelps path="debt" />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-info/30 bg-info/10 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Coins className="h-5 w-5" aria-hidden />
            Pros
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-foreground/90">
            <li>
              <strong>Less dilution</strong> than selling equity — lenders don&apos;t own your company.
            </li>
            <li>
              <strong>Predictable structure</strong> — schedule, rate, and covenants are defined up front.
            </li>
            <li>
              <strong>Interest may be tax-deductible</strong> (jurisdiction-specific; ask your accountant).
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Banknote className="h-5 w-5" aria-hidden />
            Cons
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-foreground/90">
            <li>
              <strong>Repayment pressure</strong> — cash must cover debt service even in a slow month.
            </li>
            <li>
              <strong>Covenants</strong> — lenders may restrict dividends or require minimum cash levels.
            </li>
            <li>
              <strong>Guarantees</strong> — many early-stage loans require personal or founder guarantees.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Core instruments
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          US-heavy examples below; adapt for your jurisdiction with a qualified advisor.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h4 className="font-semibold text-foreground">SBA loans (e.g. 7(a), 504)</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Government-backed term loans and real-estate / equipment programs that can reduce lender
              risk and improve terms for qualifying small businesses. Often used for working capital,
              acquisitions, or owner-occupied assets after you have financials and a bank relationship.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h4 className="font-semibold text-foreground">Venture debt</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Non-bank lenders to VC-backed companies—usually <strong>after</strong> institutional equity.
              Often includes warrants or conversion features; covenants tie to runway and revenue. Cheaper
              than equity at the margin but still expensive if you miss plan.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h4 className="font-semibold text-foreground">Revenue-based financing (RBF)</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Repay as a percentage of revenue until a defined return cap—common for recurring-revenue
              businesses. Less dilutive than equity; cost depends on growth and payback speed—model the
              effective APR carefully.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h4 className="font-semibold text-foreground">Bank lines of credit</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Revolving facilities secured by receivables, inventory, or cash—classic for smoothing
              working capital. Typically requires profitability or strong collateral; covenant-light
              versions exist for relationship-heavy SMBs.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/35 bg-primary/8/60 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          Ada&apos;s advice · debt discipline
        </h3>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-foreground/90">
          <li>
            Match structure to <strong>use of funds</strong> — don&apos;t fund 9-month experiments with
            5-year amortization you can&apos;t support.
          </li>
          <li>
            Model <strong>worst-case revenue</strong> and confirm you can still service principal +
            interest (or RBF pulls).
          </li>
          <li>
            Compare <strong>total cost</strong>—fees, warrants, OID, prepayment penalties—vs. dilution from
            equity.
          </li>
          <li>
            In <strong>survival mode</strong>, talk to lenders before you breach covenants—surprises erode
            trust fast.
          </li>
        </ul>
      </section>
    </div>
  );
}
