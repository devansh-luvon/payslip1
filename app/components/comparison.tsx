function Yes() {
  return (
    <span className="flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Yes">
        <circle cx="8" cy="8" r="6.5" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="1" />
        <path d="M5 8L7 10L11 6" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function No() {
  return (
    <span className="flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="No">
        <circle cx="8" cy="8" r="6.5" stroke="#3f3f46" strokeWidth="1" />
        <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#52525b" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Partial({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center">
      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
        {label}
      </span>
    </span>
  );
}

const rows = [
  {
    feature: "Works with phone numbers only",
    payslip: <Yes />,
    banks: <No />,
    traditional: <No />,
    crypto: <No />,
  },
  {
    feature: "Instant settlement (under 10s)",
    payslip: <Yes />,
    banks: <No />,
    traditional: <No />,
    crypto: <Partial label="sometimes" />,
  },
  {
    feature: "No crypto knowledge needed",
    payslip: <Yes />,
    banks: <Yes />,
    traditional: <Yes />,
    crypto: <No />,
  },
  {
    feature: "Global by default",
    payslip: <Yes />,
    banks: <Partial label="limited" />,
    traditional: <Partial label="limited" />,
    crypto: <Yes />,
  },
  {
    feature: "No bank account required",
    payslip: <Yes />,
    banks: <No />,
    traditional: <No />,
    crypto: <Yes />,
  },
  {
    feature: "Auto-generated payslips",
    payslip: <Yes />,
    banks: <No />,
    traditional: <Yes />,
    crypto: <No />,
  },
  {
    feature: "Non-custodial wallet recovery",
    payslip: <Yes />,
    banks: <No />,
    traditional: <No />,
    crypto: <Partial label="varies" />,
  },
  {
    feature: "Local currency withdrawal",
    payslip: <Yes />,
    banks: <Partial label="limited" />,
    traditional: <No />,
    crypto: <Partial label="limited" />,
  },
];

const cols = [
  { label: "Payslip", highlight: true },
  { label: "Wire / Bank", highlight: false },
  { label: "ADP / Gusto", highlight: false },
  { label: "Crypto Payroll", highlight: false },
];

export function Comparison() {
  return (
    <section className="border-t border-zinc-800/60 bg-zinc-900/30 px-4 py-28 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
            Why Payslip
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
            Built for the world, not one market.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400">
            Banks are slow. Traditional payroll tools don&apos;t go global. Crypto tools are too complex.
            Payslip fills the gap.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-4 pl-6 pr-4 text-left text-xs font-medium text-zinc-600">
                  Feature
                </th>
                {cols.map((col) => (
                  <th
                    key={col.label}
                    className={`px-4 py-4 text-center text-xs font-semibold ${
                      col.highlight ? "text-emerald-400" : "text-zinc-400"
                    }`}
                  >
                    {col.highlight && (
                      <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500/15 text-[9px] text-emerald-400">
                        ✦
                      </span>
                    )}
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-zinc-800/50 ${
                    i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/40"
                  }`}
                >
                  <td className="py-3.5 pl-6 pr-4 text-sm text-zinc-300">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3.5">{row.payslip}</td>
                  <td className="px-4 py-3.5">{row.banks}</td>
                  <td className="px-4 py-3.5">{row.traditional}</td>
                  <td className="px-4 py-3.5">{row.crypto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
