const employees = [
  { initials: "AR", name: "Ana Rodriguez", phone: "+55 11 ••••-4521", country: "🇧🇷", amount: "$3,200" },
  { initials: "JM", name: "James Mwangi", phone: "+254 712 ••••89", country: "🇰🇪", amount: "$2,800" },
  { initials: "PK", name: "Priya Krishnan", phone: "+91 98 ••••-0234", country: "🇮🇳", amount: "$4,500" },
  { initials: "LT", name: "Lior Tal", phone: "+972 52 ••••-771", country: "🇮🇱", amount: "$5,100" },
];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6L5 9L10 3" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-32 text-center sm:px-6">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        aria-hidden="true"
      >
        <div
          className="h-[700px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, #a1a1aa 1px, transparent 1px), linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-emerald-400">
            Global Payroll · Powered by Stellar · Now in Beta
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl">
          Pay anyone, anywhere.
          <br />
          <span className="text-emerald-400">Just a phone number.</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Payslip runs global payroll for remote teams without the banking
          complexity. Employees receive salary via SMS — wallets, payments, and
          payslips handled automatically.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/signup"
            className="flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-6 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
            style={{ boxShadow: "0 0 0 0 rgba(52,211,153,0)" }}
          >
            Start for free
            <ArrowIcon />
          </a>
          <a
            href="#how-it-works"
            className="flex h-11 items-center gap-2 rounded-lg border border-zinc-800 px-6 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-zinc-50"
          >
            See how it works
          </a>
        </div>

        {/* Trust micro-copy */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-600">
          {[
            "Free to start",
            "Instant settlement",
            "No crypto knowledge needed",
            "Teams in 30+ countries",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckIcon />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="relative z-10 mx-auto mt-20 w-full max-w-2xl">
        {/* Top glow line */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-px h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(52,211,153,0.5), transparent)",
          }}
          aria-hidden="true"
        />

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-zinc-700/80" />
                <div className="h-3 w-3 rounded-full bg-zinc-700/80" />
                <div className="h-3 w-3 rounded-full bg-zinc-700/80" />
              </div>
              <span className="text-xs text-zinc-600">payslip.app / payroll</span>
            </div>
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              ✓ All Delivered
            </span>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600">
                  November 2024
                </p>
                <p className="mt-0.5 text-sm font-medium text-zinc-200">
                  Payroll Run · {employees.length} employees
                </p>
              </div>
              <p className="text-sm font-semibold text-zinc-50">$15,600 USDC</p>
            </div>

            <div className="space-y-1.5">
              {employees.map((emp) => (
                <div
                  key={emp.name}
                  className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300">
                      {emp.initials}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-zinc-200">
                          {emp.name}
                        </p>
                        <span className="text-sm">{emp.country}</span>
                      </div>
                      <p className="text-[11px] text-zinc-600">{emp.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium text-zinc-300">
                      {emp.amount}
                    </p>
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
              Run next payroll
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
