const employerSteps = [
  {
    step: "01",
    title: "Add your team",
    description:
      "Upload a CSV or add employees one by one. All you need is their name and phone number. No bank details, no wallet address.",
  },
  {
    step: "02",
    title: "Fund your payroll wallet",
    description:
      "Deposit USDC into your Payslip workspace. Your balance is visible at all times. No minimum — fund exactly what you need.",
  },
  {
    step: "03",
    title: "Run payroll",
    description:
      "Set salaries, review the run, and confirm. Every payment is settled in seconds. Payslips are generated and archived automatically.",
  },
];

const employeeSteps = [
  {
    step: "01",
    title: "Receive an SMS",
    description:
      "After payroll runs, employees get a text with a secure claim link. No app to install, no account to create in advance.",
  },
  {
    step: "02",
    title: "Verify with OTP",
    description:
      "Enter the one-time code sent to their phone. That's all the identity verification needed. No KYC forms, no ID uploads.",
  },
  {
    step: "03",
    title: "Access salary instantly",
    description:
      "A wallet is created automatically. Salary is already there. Employees can view, send, or withdraw to local currency immediately.",
  },
];

function StepCard({
  step,
  title,
  description,
  last,
}: {
  step: string;
  title: string;
  description: string;
  last: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-400">
          {step}
        </div>
        {!last && <div className="mt-2 w-px flex-1 bg-zinc-800" />}
      </div>
      <div className={`pb-8 ${last ? "" : ""}`}>
        <h4 className="mb-1.5 text-sm font-semibold text-zinc-100">{title}</h4>
        <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-zinc-800/60 bg-zinc-900/30 px-4 py-28 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            How It Works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Simple for everyone involved.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            Three steps for employers. Three steps for employees. Zero blockchain knowledge required.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Employer column */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg">
                🏢
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600">For Employers</p>
                <p className="text-sm font-semibold text-zinc-100">Run payroll in minutes</p>
              </div>
            </div>
            <div>
              {employerSteps.map((s, i) => (
                <StepCard key={s.step} {...s} last={i === employerSteps.length - 1} />
              ))}
            </div>
            <a
              href="/signup"
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Start running payroll
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Employee column */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-lg">
                📱
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600">For Employees</p>
                <p className="text-sm font-semibold text-zinc-100">Get paid, instantly</p>
              </div>
            </div>
            <div>
              {employeeSteps.map((s, i) => (
                <StepCard key={s.step} {...s} last={i === employeeSteps.length - 1} />
              ))}
            </div>
            <div className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 text-sm text-zinc-400">
              No setup required · Arrives via SMS
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
