import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Badge, statusVariant } from "@/app/components/ui/badge";
import { formatUsdc } from "@/lib/utils";
import { NewWorkspaceButton } from "./new-workspace-button";

async function getDashboardData(employerId: string) {
  const [employer, workspaces] = await Promise.all([
    prisma.employer.findUnique({ where: { id: employerId } }),
    prisma.workspace.findMany({
      where: { employerId },
      include: {
        payrolls: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { _count: { select: { workers: true } } },
        },
        _count: { select: { payrolls: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { employer, workspaces };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") redirect("/login");

  const { employer, workspaces } = await getDashboardData(session.id);
  if (!employer) redirect("/login");

  const totalPayrolls = workspaces.reduce((a, w) => a + w._count.payrolls, 0);
  const kybPending = !employer.isApproved;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">
            Welcome, {employer.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {employer.companyName ?? "Complete your profile to get started"}
          </p>
        </div>
        {employer.isApproved && <NewWorkspaceButton />}
      </div>

      {/* KYB alert */}
      {kybPending && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              {employer.kybStatus === "NOT_SUBMITTED"
                ? "Complete your KYB verification to unlock payroll"
                : employer.kybStatus === "PENDING"
                ? "KYB under review — we'll notify you once approved"
                : "KYB rejected — please re-submit your documents"}
            </p>
            <Link href="/onboarding" className="mt-1 text-xs text-amber-400 underline hover:text-amber-300">
              {employer.kybStatus === "NOT_SUBMITTED" ? "Start verification →" : "View details →"}
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Workspaces", value: workspaces.length },
          { label: "Total Payrolls", value: totalPayrolls },
          { label: "KYB Status", value: employer.kybStatus, isBadge: true },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-zinc-500">{stat.label}</p>
              {stat.isBadge ? (
                <Badge className="mt-1" variant={statusVariant(stat.value as string)}>
                  {stat.value}
                </Badge>
              ) : (
                <p className="mt-1 text-2xl font-semibold text-zinc-50">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workspaces */}
      {workspaces.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-zinc-500">No workspaces yet.</p>
            {employer.isApproved && <NewWorkspaceButton />}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Workspaces
          </h2>
          {workspaces.map((ws) => (
            <Card key={ws.id} className="hover:border-zinc-700 transition-colors">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/workspace/${ws.id}`}
                      className="text-base font-semibold text-zinc-100 hover:text-emerald-400 transition-colors"
                    >
                      {ws.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {ws._count.payrolls} payroll{ws._count.payrolls !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/workspace/${ws.id}`}
                    className="shrink-0 rounded-lg border border-zinc-800 p-2 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>

                {ws.payrolls.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {ws.payrolls.map((pr) => (
                      <Link
                        key={pr.id}
                        href={`/dashboard/payroll/${pr.id}`}
                        className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-3 py-2 hover:bg-zinc-800/60 transition-colors"
                      >
                        <span className="text-xs text-zinc-300">{pr.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">{pr._count.workers} workers</span>
                          <Badge variant={statusVariant(pr.status)}>{pr.status}</Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
