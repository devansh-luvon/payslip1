export function CTA() {
  return (
    <section className="border-t border-zinc-800/60 px-4 py-28 sm:px-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 px-8 py-16 text-center sm:px-16">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <div
            className="h-[400px] w-[400px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              Open beta · Free to start
            </span>
          </div>

          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Your team is global.
            <br />
            Your payroll should be too.
          </h2>

          <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-zinc-400">
            Set up in minutes. Run your first payroll for free. No blockchain
            experience required — for you or your team.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="flex h-12 items-center gap-2 rounded-lg bg-emerald-500 px-8 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Start for free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="mailto:hello@payslip.app"
              className="flex h-12 items-center rounded-lg border border-zinc-700 px-8 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
            >
              Talk to us
            </a>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            No credit card required · Cancel anytime · Setup takes under 5 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
