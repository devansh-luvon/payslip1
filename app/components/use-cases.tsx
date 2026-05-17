const cases = [
  {
    emoji: "🌍",
    title: "Remote-first teams",
    description:
      "Pay engineers, designers, and PMs across 10 countries from a single payroll run. No wire fees, no delays, no per-country banking setup.",
    tags: ["Multi-country", "Recurring payroll", "Payslips"],
  },
  {
    emoji: "🧑‍💻",
    title: "Freelancers & contractors",
    description:
      "Pay project-based contractors instantly when work is delivered. They receive salary via SMS — no invoice processing, no 30-day net terms.",
    tags: ["Instant payout", "No bank needed", "On-demand"],
  },
  {
    emoji: "🏛️",
    title: "DAOs & Web3 teams",
    description:
      "Your contributors don't want to manage wallets. Payslip gives Web3-native organizations a human payroll UX without sacrificing on-chain settlement.",
    tags: ["On-chain", "No seed phrases", "USDC"],
  },
  {
    emoji: "🚀",
    title: "Global startups",
    description:
      "Early-stage companies hiring internationally before setting up local entities. Run compliant, documented payroll from day one without a finance team.",
    tags: ["Early-stage", "Compliance-ready", "Scalable"],
  },
];

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="px-4 py-28 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            Use Cases
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            For any team with global ambitions.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            Whether you have 3 contractors or 300 employees, Payslip handles it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <div
              key={c.title}
              className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
            >
              <div className="mb-4 text-3xl">{c.emoji}</div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-100">
                {c.title}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-500">
                {c.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-0.5 text-[11px] font-medium text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
