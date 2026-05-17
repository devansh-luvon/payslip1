import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatUsdc } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge, statusVariant } from "@/app/components/ui/badge";
import Link from "next/link";
import { KybApprovalPanel } from "./kyb-approval-panel";

async function getAdminStats() {
  const [employerCount, pendingKyb, totalPayrolls, activePayrolls] = await Promise.all([
    prisma.employer.count(),
    prisma.employer.count({ where: { kybStatus: "PENDING" } }),
    prisma.payroll.count(),
    prisma.payroll.count({ where: { status: "ACTIVE" } }),
  ]);

  const pendingEmployers = await prisma.employer.findMany({
    where: { kybStatus: "PENDING" },
    include: { kybDocuments: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  const recentPayrolls = await prisma.payroll.findMany({
    include: {
      workspace: { include: { employer: { select: { name: true } } } },
      _count: { select: { workers: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return { employerCount, pendingKyb, totalPayrolls, activePayrolls, pendingEmployers, recentPayrolls };
}

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const stats = await getAdminStats();

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Platform overview and KYB management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Employers", value: stats.employerCount },
          { label: "Pending KYB", value: stats.pendingKyb, alert: stats.pendingKyb > 0 },
          { label: "Total Payrolls", value: stats.totalPayrolls },
          { label: "Active Payrolls", value: stats.activePayrolls },
        ].map((s) => (
          <Card key={s.label} className={s.alert ? "border-amber-500/30" : ""}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.alert ? "text-amber-400" : "text-zinc-50"}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* KYB Queue */}
        <Card>
          <CardHeader>
            <CardTitle>KYB Pending Review</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.pendingEmployers.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-zinc-500">No pending applications.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {stats.pendingEmployers.map((emp) => (
                  <KybApprovalPanel key={emp.id} employer={emp} />
                ))}
              </div>
            )}
            {stats.pendingKyb > 10 && (
              <div className="border-t border-zinc-800 px-5 py-3">
                <Link href="/admin/employers?status=PENDING" className="text-xs text-emerald-400 hover:text-emerald-300">
                  View all {stats.pendingKyb} pending →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payrolls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payrolls</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {stats.recentPayrolls.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{pr.name}</p>
                    <p className="text-xs text-zinc-500">
                      {pr.workspace.employer.name} · {pr._count.workers} workers
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-400">
                      ${formatUsdc(pr.totalAmount.toString())}
                    </span>
                    <Badge variant={statusVariant(pr.status)} className="text-[10px]">{pr.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
