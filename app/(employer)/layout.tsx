import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase, Settings, LogOut } from "lucide-react";

async function SidebarNav() {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-950 p-4 md:flex">
      {/* Logo */}
      <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-sm font-semibold text-zinc-100">PaySlip</span>
      </Link>

      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        >
          <item.icon size={16} />
          {item.label}
        </Link>
      ))}

      <div className="mt-auto border-t border-zinc-800 pt-4">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") redirect("/login");

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
