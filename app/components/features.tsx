function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="7.5" cy="7.5" r="6.5" stroke="#10b981" strokeWidth="1" />
      <path d="M4.5 7.5L6.5 9.5L10.5 5.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const employerFeatures = [
  { title: "One-click payroll runs", desc: "Run payroll for your entire team in a single action. Review, confirm, done." },
  { title: "Employee directory", desc: "Manage your team with names, phone numbers, salary, and payment history in one place." },
  { title: "Automatic payslips", desc: "Every payment generates a PDF payslip, archived and downloadable by both parties." },
  { title: "Payroll history & audit log", desc: "Full record of every run, every payment, every timestamp. Export anytime." },
  { title: "Multi-currency support", desc: "Set salaries in USD, EUR, or local currency. Payslip handles the conversion." },
  { title: "Compliance ready", desc: "Built-in KYC tiers and transaction monitoring to keep you on the right side of regulations." },
];

const employeeFeatures = [
  { title: "No wallet setup required", desc: "A non-custodial wallet is created automatically the first time an employee claims their salary." },
  { title: "Instant salary access", desc: "Funds arrive in seconds, not days. No waiting for bank clearing or intermediary confirmation." },
  { title: "Full transaction history", desc: "Employees can view every payment received, with dates, amounts, and payslip downloads." },
  { title: "Send to anyone", desc: "Send funds to other Payslip users or any Stellar address directly from the dashboard." },
  { title: "Local currency withdrawal", desc: "Cash out to mobile money, bank transfer, or local agents in 40+ countries." },
  { title: "Account recovery via phone", desc: "Lost access? Recover the wallet using the original phone number. No seed phrase needed." },
];

function FeatureList({ features }: { features: typeof employerFeatures }) {
  return (
    <ul className="space-y-4">
      {features.map((f) => (
        <li key={f.title} className="flex gap-3">
          <Check />
          <div>
            <p className="text-sm font-medium text-zinc-100">{f.title}</p>
            <p className="mt-0.5 text-sm text-zinc-500">{f.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="px-4 py-28 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Everything your team needs.
            <br className="hidden sm:block" />
            Nothing they don&apos;t.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Employer features */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-lg">
                🏢
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600">
                  Employer Dashboard
                </p>
                <p className="text-sm font-semibold text-zinc-100">
                  Built for finance teams
                </p>
              </div>
            </div>
            <FeatureList features={employerFeatures} />
          </div>

          {/* Employee features */}
          <div className="rounded-2xl border border-emerald-500/15 bg-zinc-900 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-lg">
                📱
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600">
                  Employee App
                </p>
                <p className="text-sm font-semibold text-zinc-100">
                  Built for everyone
                </p>
              </div>
            </div>
            <FeatureList features={employeeFeatures} />
          </div>
        </div>
      </div>
    </section>
  );
}
