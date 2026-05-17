import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge, statusVariant } from "@/app/components/ui/badge";
import { formatUsdc } from "@/lib/utils";
import { MilestoneActions } from "./milestone-actions";

export default async function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") redirect("/login");

  const { id } = await params;

  const payroll = await prisma.payroll.findFirst({
    where: { id, workspace: { employerId: session.id } },
    include: {
      workspace: { select: { id: true, name: true } },
      workers: { orderBy: { name: "asc" } },
      milestones: {
        include: { worker: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      scheduledTasks: {
        include: { worker: { select: { id: true, name: true } } },
      },
    },
  });

  if (!payroll) notFound();

  const totalMilestonePaid = payroll.milestones
    .filter((m) => m.status === "PAID")
    .reduce((a, m) => a + parseFloat(m.amount.toString()), 0);

  const submittedMilestones = payroll.milestones.filter((m) => m.status === "SUBMITTED");

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-200 transition-colors">Dashboard</Link>
        <span className="text-zinc-700">/</span>
        <Link href={`/dashboard/workspace/${payroll.workspace.id}`} className="hover:text-zinc-200 transition-colors">
          {payroll.workspace.name}
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300">{payroll.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-zinc-50">{payroll.name}</h1>
            <Badge variant={statusVariant(payroll.status)}>{payroll.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {payroll.payrollType} · {payroll.token} · {payroll.workers.length} workers
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Payroll", value: `$${formatUsdc(payroll.totalAmount.toString())}` },
          { label: "Platform Fee", value: `$${formatUsdc(payroll.platformFee.toString())}` },
          { label: "Paid Out", value: `$${formatUsdc(totalMilestonePaid)}` },
          {
            label: payroll.payrollType === "MILESTONE" ? "Milestones" : "Tasks",
            value: payroll.payrollType === "MILESTONE"
              ? `${payroll.milestones.length}`
              : `${payroll.scheduledTasks.length}`,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-50">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funding info */}
      {payroll.fundTxHash && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5">
          <span className="text-zinc-400 font-medium">Escrow TX:</span>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${payroll.fundTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-emerald-400 hover:text-emerald-300 truncate"
          >
            {payroll.fundTxHash.slice(0, 24)}…
          </a>
        </div>
      )}

      {/* Action needed banner */}
      {submittedMilestones.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm font-medium text-amber-300">
            {submittedMilestones.length} milestone{submittedMilestones.length !== 1 ? "s" : ""} awaiting your review
          </p>
        </div>
      )}

      {/* Milestones table */}
      {payroll.payrollType === "MILESTONE" && (
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {payroll.milestones.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-zinc-500">No milestones defined.</p>
              ) : (
                payroll.milestones.map((m) => (
                  <div key={m.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-100 text-sm">{m.name}</span>
                          <Badge variant={statusVariant(m.status)} className="text-[10px]">{m.status}</Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                          <span>{m.worker.name}{m.worker.role ? ` · ${m.worker.role}` : ""}</span>
                          <span>·</span>
                          <span className="font-medium text-zinc-300">${formatUsdc(m.amount.toString())} USDC</span>
                          {m.expectedCompletion && (
                            <>
                              <span>·</span>
                              <span>Due {new Date(m.expectedCompletion).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        {m.submissionUrl && (
                          <a
                            href={m.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            View submission →
                          </a>
                        )}
                        {m.submissionNote && (
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{m.submissionNote}</p>
                        )}
                        {m.rejectionFeedback && (
                          <p className="mt-1 text-xs text-red-400">Feedback: {m.rejectionFeedback}</p>
                        )}
                        {m.txHash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${m.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs font-mono text-emerald-400 hover:text-emerald-300"
                          >
                            Tx: {m.txHash.slice(0, 16)}…
                          </a>
                        )}
                      </div>
                      <MilestoneActions
                        milestoneId={m.id}
                        status={m.status}
                        payrollStatus={payroll.status}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled tasks table */}
      {payroll.payrollType === "SCHEDULED" && (
        <Card>
          <CardHeader><CardTitle>Scheduled Tasks</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800">
              {payroll.scheduledTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.worker.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-200">${formatUsdc(t.amount.toString())} USDC</span>
                    <Badge variant={t.isPaid ? "success" : "muted"}>{t.isPaid ? "PAID" : "PENDING"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workers */}
      <Card>
        <CardHeader><CardTitle>Workers ({payroll.workers.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {payroll.workers.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{w.name}</p>
                  {w.role && <p className="text-xs text-zinc-500">{w.role}</p>}
                </div>
                <Badge variant={w.isOnboarded ? "success" : "muted"}>
                  {w.isOnboarded ? "Onboarded" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
