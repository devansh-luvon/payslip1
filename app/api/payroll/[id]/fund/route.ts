import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { verifyTransaction } from "@/lib/stellar";
import { z } from "zod";

const confirmSchema = z.object({
  txHash: z.string().min(60),
  contractId: z.string().min(56).optional(),
});

/**
 * POST /api/payroll/[id]/fund
 *
 * Called by the frontend AFTER the employer has:
 *   1. Built the Soroban escrow contract deploy + deposit transaction client-side.
 *   2. Signed it with Freighter.
 *   3. Submitted it to the Stellar network.
 *
 * This endpoint verifies the transaction on-chain and marks the payroll ACTIVE.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/payroll/[id]/fund">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
    include: { workers: true },
  });
  if (!payroll) return err("Payroll not found", 404);
  if (payroll.status !== "DRAFT") return err("Payroll already funded", 400);
  if (payroll.workers.length === 0) return err("Add workers before funding", 400);

  const hasItems =
    payroll.payrollType === "MILESTONE"
      ? (await prisma.milestone.count({ where: { payrollId } })) > 0
      : (await prisma.scheduledTask.count({ where: { payrollId } })) > 0;

  if (!hasItems) {
    return err(
      payroll.payrollType === "MILESTONE"
        ? "Define milestones before funding"
        : "Define scheduled tasks before funding",
      400
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  // Verify transaction is on-chain
  const onChain = await verifyTransaction(parsed.data.txHash);
  if (!onChain) return err("Transaction not found on Stellar network", 400);

  // Unlock milestones — workers can now submit
  if (payroll.payrollType === "MILESTONE") {
    await prisma.milestone.updateMany({
      where: { payrollId },
      data: { status: "PENDING_SUBMISSION" },
    });
  }

  const updatedPayroll = await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      status: "ACTIVE",
      fundTxHash: parsed.data.txHash,
      contractId: parsed.data.contractId,
    },
  });

  return ok(updatedPayroll);
}
