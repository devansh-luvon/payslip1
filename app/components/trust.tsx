const trustItems = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 2L19 5.5V11C19 15.4 15.4 19.3 11 20C6.6 19.3 3 15.4 3 11V5.5L11 2Z" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 11L10 13.5L14.5 8.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Non-custodial by design",
    description:
      "Employees own their wallets. Payslip uses SEP-30 social recovery — wallets are tied to phone numbers, not stored on our servers.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="#34d399" strokeWidth="1.5" />
        <path d="M11 7V11L14 13" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Instant, final settlement",
    description:
      "Stellar settles transactions in 3–5 seconds with cryptographic finality. No chargebacks, no holds, no intermediaries reversing payments.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="8" width="16" height="11" rx="2" stroke="#34d399" strokeWidth="1.5" />
        <path d="M7 8V6C7 3.8 9.2 2 11 2C12.8 2 15 3.8 15 6V8" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "KYC & compliance tiers",
    description:
      "Built-in KYC verification, transaction monitoring, and configurable limits. Employers stay compliant without managing it themselves.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 3L19 7V15L11 19L3 15V7L11 3Z" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 8V14M8.5 9.5L11 8L13.5 9.5" stroke="#34d399" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Stellar network infrastructure",
    description:
      "Built on Stellar — an ISO 20022 compliant, battle-tested blockchain processing millions of transactions per day with sub-cent fees.",
  },
];

export function Trust() {
  return (
    <section className="border-t border-zinc-800/60 bg-zinc-900/30 px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            Security & Trust
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Enterprise-grade infrastructure.
            <br className="hidden sm:block" /> Zero complexity for users.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            The security is real. The complexity is hidden. That&apos;s the whole point.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                {item.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-100">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
          {["Built on Stellar", "USDC Payments", "SOC 2 In Progress", "ISO 20022 Compliant"].map(
            (badge) => (
              <div
                key={badge}
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-zinc-400">{badge}</span>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
