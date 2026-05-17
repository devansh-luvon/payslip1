import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUsdcBalance } from "@/lib/stellar";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "WORKER") return err("Unauthorized", 401);

  const worker = await prisma.worker.findUnique({
    where: { id: session.id },
    include: {
      milestones: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, name: true, description: true, amount: true,
          status: true, submissionUrl: true, submissionNote: true,
          rejectionFeedback: true, expectedCompletion: true,
          submittedAt: true, approvedAt: true, txHash: true,
        },
      },
      scheduledTasks: {
        select: { id: true, name: true, amount: true, isPaid: true, txHash: true },
      },
      payroll: {
        select: { id: true, name: true, payrollType: true, status: true, token: true },
      },
    },
  });

  if (!worker) return err("Worker not found", 404);

  // Fetch live on-chain balance
  const usdcBalance = worker.walletAddress
    ? await getUsdcBalance(worker.walletAddress)
    : "0";

  // Compute locked earnings (PENDING_SUBMISSION + SUBMITTED milestones)
  const lockedEarnings = worker.milestones
    .filter((m) => ["LOCKED", "PENDING_SUBMISSION", "SUBMITTED"].includes(m.status))
    .reduce((acc, m) => acc + parseFloat(m.amount.toString()), 0);

  return ok({
    id: worker.id,
    name: worker.name,
    role: worker.role,
    walletAddress: worker.walletAddress,
    isOnboarded: worker.isOnboarded,
    payroll: worker.payroll,
    milestones: worker.milestones,
    scheduledTasks: worker.scheduledTasks,
    balance: {
      available: usdcBalance,
      locked: lockedEarnings.toFixed(2),
    },
  });
}
