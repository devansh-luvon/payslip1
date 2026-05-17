import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { sendUsdc } from "@/lib/stellar";
import { decryptSecret } from "@/lib/sep30";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("APPROVE"),
    txHash: z.string().min(60).optional(), // Soroban contract tx hash (if using contract)
  }),
  z.object({
    action: z.literal("REJECT"),
    feedback: z.string().min(1, "Feedback is required when rejecting"),
  }),
]);

/**
 * POST /api/milestones/[id]/review
 *
 * Employer approves or rejects a submitted milestone.
 *
 * On APPROVE:
 *   - In Soroban flow: employer already signed + submitted the contract's
 *     approve_milestone() call on the frontend. txHash is provided.
 *   - In direct flow (for testnet without contract): platform sends USDC
 *     from treasury directly to worker wallet.
 *   - DB updated to PAID.
 *
 * On REJECT:
 *   - Status reverts to PENDING_SUBMISSION with feedback.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/milestones/[id]/review">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: milestoneId } = await ctx.params;

  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, payroll: { workspace: { employerId: session.id } } },
    include: { worker: true, payroll: true },
  });
  if (!milestone) return err("Milestone not found", 404);
  if (milestone.status !== "SUBMITTED") return err("Milestone is not in SUBMITTED state", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  if (parsed.data.action === "REJECT") {
    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "PENDING_SUBMISSION",
        rejectionFeedback: parsed.data.feedback,
      },
    });
    return ok(updated);
  }

  // ── APPROVE ──────────────────────────────────────────────────────────────

  let txHash = parsed.data.txHash;

  if (!txHash) {
    // No Soroban contract (testnet direct mode) — send USDC from treasury
    const worker = milestone.worker;
    if (!worker.walletAddress || !worker.encryptedSecret) {
      return err("Worker wallet not yet created", 400);
    }

    const platformSecret = process.env.PLATFORM_TREASURY_SECRET;
    if (!platformSecret) return err("Platform treasury not configured", 500);

    const amountStr = milestone.amount.toString();
    txHash = await sendUsdc(
      platformSecret,
      worker.walletAddress,
      amountStr,
      `milestone:${milestone.id.slice(0, 16)}`
    );
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "PAID",
      txHash,
      approvedAt: new Date(),
    },
  });

  return ok(updated);
}
