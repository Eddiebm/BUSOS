import Link from "next/link";
import { Brain, Map, Zap } from "lucide-react";

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <section className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            The Founder Operating System
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-slate-600">
            From idea to execution. Nothing missed.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Try it in 60 seconds →
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mt-24 grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="text-center md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 md:mx-0">
              <Brain className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Ada knows your story
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You tell Ada your dream once. She carries it through every decision, every milestone,
              every moment of doubt — for the entire life of your venture.
            </p>
          </div>
          <div className="text-center md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 md:mx-0">
              <Map className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Nothing falls through the cracks
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every legal filing, IP protection, financial model, and growth milestone is scheduled
              automatically based on your specific venture. Not a generic checklist — your checklist.
            </p>
          </div>
          <div className="text-center md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 md:mx-0">
              <Zap className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Intelligence that adapts
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              A first-time founder in Lagos with 10 hours a week gets different advice than a serial
              founder in New York with a team of 20. BUSOS knows the difference.
            </p>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Same question. Two founders. Two different answers.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                First-time founder, bootstrapped, 10 hrs/week
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                Your biggest risk right now isn&apos;t competition — it&apos;s spending 6 months
                building something nobody wants. Before you write a single line of code, you need 10
                customer conversations. Here&apos;s exactly how to run them…
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Serial founder, seed funded, full-time team
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                You&apos;ve been here before, so I&apos;ll skip the basics. Your unit economics
                don&apos;t support the growth rate you&apos;re projecting. At current CAC,
                you&apos;ll run out of runway in 14 months before hitting the retention numbers that
                justify a Series A…
              </p>
            </div>
          </div>
        </section>

        <section className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Start your venture. 5 minutes.</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-600">
            Free to start. No credit card. No generic advice.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Start Your Venture →
          </Link>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <span>BUSOS — Founder Operating System</span>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/sign-in" className="text-slate-600 underline-offset-2 hover:underline">
          Sign In
        </Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/demo" className="text-slate-600 underline-offset-2 hover:underline">
          Demo
        </Link>
      </footer>
    </div>
  );
}
