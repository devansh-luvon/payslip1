import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, BarChart3, Shield, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-zinc-800 bg-zinc-950 p-4 md:flex">
        <div className="mb-4 flex items-center gap-2 px-2">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-100">Admin</span>
        </div>
        {[
          { href: "/admin", label: "Overview", icon: BarChart3 },
          { href: "/admin/employers", label: "Employers", icon: Users },
          { href: "/admin/payrolls", label: "Payrolls", icon: Shield },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            <item.icon size={15} />
            {item.label}
          </Link>
        ))}
        <div className="mt-auto border-t border-zinc-800 pt-4">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
