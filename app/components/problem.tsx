const problems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="#a1a1aa" strokeWidth="1.5" />
        <path d="M10 6V10L13 12" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "3–5 business days",
    title: "Wire transfers are painfully slow",
    description:
      "Your developer in Lagos or contractor in Karachi shouldn't wait a week to get paid. Traditional banking was built for a different era.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="14" height="10" rx="2" stroke="#a1a1aa" strokeWidth="1.5" />
        <path d="M3 10H17" stroke="#a1a1aa" strokeWidth="1.5" />
        <path d="M7 4H13" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "1.4B people unbanked",
    title: "Not everyone has a bank account",
    description:
      "Standard payroll tools require IBAN numbers, routing codes, and verified bank accounts. Billions of workers simply don't have them.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3L17 7V13L10 17L3 13V7L10 3Z" stroke="#a1a1aa" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 8V12M8 9.5L10 8L12 9.5" stroke="#a1a1aa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Seed phrases, gas fees, wallets",
    title: "Crypto payroll is too technical",
    description:
      "Existing crypto payroll tools require employees to set up wallets, manage seed phrases, and understand gas fees. Most people won't do it.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 7H15M5 10H12M5 13H10" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="#a1a1aa" strokeWidth="1.5" />
      </svg>
    ),
    label: "Every country is different",
    title: "Compliance is a per-country headache",
    description:
      "Each new country adds legal and banking overhead. Most payroll tools are built for one market and bolt on global coverage as an afterthought.",
  },
];

export function Problem() {
  return (
    <section className="border-t border-zinc-800/60 bg-zinc-900/30 px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            The Problem
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Global payroll is broken.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            The world runs on remote teams. The tools to pay them haven&apos;t caught up.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/60">
                {p.icon}
              </div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                {p.label}
              </p>
              <h3 className="mb-2 text-sm font-semibold text-zinc-100">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
