function Check({ muted }: { muted?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
      <path
        d="M3 7.5L6 10.5L12 4.5"
        stroke={muted ? "#52525b" : "#10b981"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const tiers = [
  {
    name: "Starter",
    price: "Free",
    priceSub: "forever",
    description: "For small teams getting started with global payroll.",
    cta: "Get started free",
    ctaStyle: "border border-zinc-700 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-700",
    featured: false,
    features: [
      "Up to 5 employees",
      "1.5% per payroll run",
      "Automatic payslips",
      "SMS claim links",
      "Basic dashboard",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$49",
    priceSub: "per month",
    description: "For growing teams that run payroll regularly across multiple countries.",
    cta: "Start 14-day trial",
    ctaStyle: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400",
    featured: true,
    features: [
      "Up to 50 employees",
      "0.75% per payroll run",
      "Payroll history & audit log",
      "Multi-currency support",
      "Priority support",
      "CSV import",
      "Custom payslip branding",
      "Webhook notifications",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceSub: "talk to us",
    description: "For organizations with large teams, custom compliance requirements, or high volume.",
    cta: "Contact sales",
    ctaStyle: "border border-zinc-700 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-700",
    featured: false,
    features: [
      "Unlimited employees",
      "Custom processing fee",
      "Dedicated account manager",
      "Custom KYC thresholds",
      "SLA guarantee",
      "White-label options",
      "On-premise data residency",
      "SSO / SAML",
    ],
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="px-4 py-28 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            Pricing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Transparent pricing.
            <br className="hidden sm:block" /> No hidden fees.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            Start free, scale as you grow. You only pay when you run payroll.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                tier.featured
                  ? "border-emerald-500/30 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-px inset-x-6 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              )}
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full border border-emerald-500/30 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-emerald-400">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight text-zinc-50">
                    {tier.price}
                  </span>
                  <span className="text-sm text-zinc-500">{tier.priceSub}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {tier.description}
                </p>
              </div>

              <a
                href="/signup"
                className={`mb-6 flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors ${tier.ctaStyle}`}
              >
                {tier.cta}
              </a>

              <ul className="space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check muted={!tier.featured} />
                    <span className="text-sm text-zinc-400">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          All plans include automatic payslips, SMS delivery, wallet provisioning, and Stellar settlement.
          Processing fees are charged per payroll run on the total disbursed amount.
        </p>
      </div>
    </section>
  );
}
