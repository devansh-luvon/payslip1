import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1L12 4V9L6.5 12L1 9V4L6.5 1Z" fill="white" />
                <path d="M6.5 4.5V8.5M4.5 5.8L6.5 4.5L8.5 5.8" stroke="#10b981" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-50">
              Payslip
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Use cases", href: "#use-cases" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden items-center rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100 sm:flex"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Get started
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2.5 6H9.5M9.5 6L7 3.5M9.5 6L7 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
