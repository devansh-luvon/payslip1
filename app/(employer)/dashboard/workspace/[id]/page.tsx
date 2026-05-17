import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge, statusVariant } from "@/app/components/ui/badge";
import { formatUsdc } from "@/lib/utils";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") redirect("/login");

  const { id } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, employerId: session.id },
    include: {
      payrolls: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { workers: true, milestones: true } } },
      },
    },
  });

  if (!workspace) notFound();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={14} />
          Dashboard
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-300">{workspace.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">{workspace.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {workspace.payrolls.length} payroll{workspace.payrolls.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/payroll/create?workspace=${id}`}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
        >
          <Plus size={14} />
          New Payroll
        </Link>
      </div>

      {/* Payrolls */}
      {workspace.payrolls.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-zinc-500">No payrolls yet in this workspace.</p>
            <Link
              href={`/dashboard/payroll/create?workspace=${id}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              <Plus size={14} />
              Create first payroll
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workspace.payrolls.map((payroll) => (
            <Link key={payroll.id} href={`/dashboard/payroll/${payroll.id}`}>
              <Card className="hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100 truncate">{payroll.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        <span>{payroll.payrollType}</span>
                        <span>·</span>
                        <span>{payroll._count.workers} workers</span>
                        {payroll.payrollType === "MILESTONE" && (
                          <>
                            <span>·</span>
                            <span>{payroll._count.milestones} milestones</span>
                          </>
                        )}
                        {Number(payroll.totalAmount) > 0 && (
                          <>
                            <span>·</span>
                            <span>${formatUsdc(payroll.totalAmount.toString())} USDC</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusVariant(payroll.status)}>{payroll.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
