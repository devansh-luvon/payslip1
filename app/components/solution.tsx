const steps = [
  {
    role: "Employer",
    emoji: "🏢",
    color: "border-zinc-700 bg-zinc-800/60",
    labelColor: "text-zinc-400",
    action: "Adds team members by phone number and funds the payroll wallet.",
    cta: "One-click payroll run",
  },
  {
    role: "Payslip",
    emoji: "⚡",
    color: "border-emerald-500/30 bg-emerald-500/5",
    labelColor: "text-emerald-400",
    action: "Creates wallets, processes payments, generates payslips — instantly.",
    cta: "Fully automated",
  },
  {
    role: "Employee",
    emoji: "📱",
    color: "border-zinc-700 bg-zinc-800/60",
    labelColor: "text-zinc-400",
    action: "Receives an SMS, verifies identity, and accesses their salary dashboard.",
    cta: "No crypto, no bank needed",
  },
];

function ArrowRight() {
  return (
    <div className="hidden shrink-0 items-center justify-center lg:flex">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ArrowDown() {
  return (
    <div className="flex items-center justify-center lg:hidden">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Solution() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            The Solution
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Payroll that works the way <br className="hidden sm:block" />
            your team actually works.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            You add a phone number. We handle everything else — wallet, payment, payslip, compliance.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-stretch">
          {steps.map((step, i) => (
            <>
              <div
                key={step.role}
                className={`flex flex-1 flex-col rounded-2xl border p-6 ${step.color}`}
              >
                <div className="mb-4 text-3xl">{step.emoji}</div>
                <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${step.labelColor}`}>
                  {step.role}
                </p>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-400">
                  {step.action}
                </p>
                <div className="mt-4 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-300">{step.cta}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <>
                  <ArrowRight key={`arrow-right-${i}`} />
                  <ArrowDown key={`arrow-down-${i}`} />
                </>
              )}
            </>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-zinc-600">
          The entire flow — from adding an employee to them receiving salary — takes under 60 seconds.
        </p>
      </div>
    </section>
  );
}
