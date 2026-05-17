const links = {
  Product: ["How it works", "Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Documentation", "API Reference", "Status", "Support"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
};

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M6.5 1L12 4V9L6.5 12L1 9V4L6.5 1Z" fill="white" />
                  <path d="M6.5 4.5V8.5M4.5 5.8L6.5 4.5L8.5 5.8" stroke="#10b981" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold text-zinc-50">Payslip</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-500">
              Global payroll as simple as sending a message. Built on Stellar.
            </p>
            <div className="flex gap-3">
              {["𝕏", "in", "gh"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {group}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800/60 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Payslip. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-zinc-500">
              All systems operational
            </span>
          </div>
          <p className="text-xs text-zinc-700">
            Powered by{" "}
            <a href="https://stellar.org" className="text-zinc-600 hover:text-zinc-400 transition-colors">
              Stellar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
