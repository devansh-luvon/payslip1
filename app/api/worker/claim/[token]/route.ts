import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, err, hashPhone } from "@/lib/utils";
import { generateOtp, otpExpiry, sendOtp } from "@/lib/sms";

/**
 * GET /api/worker/claim/[token]
 * Validates the claim token and returns basic payroll info for the claim page.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/worker/claim/[token]">) {
  const { token } = await ctx.params;

  const worker = await prisma.worker.findUnique({
    where: { claimToken: token },
    include: {
      payroll: {
        include: {
          milestones: {
            where: { workerId: undefined }, // resolved below
            select: { id: true, name: true, amount: true, status: true },
          },
        },
      },
    },
  });

  // Load worker milestones separately
  if (!worker) return err("Invalid or expired claim link", 404);
  if (worker.claimTokenExpiry && worker.claimTokenExpiry < new Date()) {
    return err("Claim link has expired", 410);
  }

  const milestones = await prisma.milestone.findMany({
    where: { workerId: worker.id },
    select: { id: true, name: true, amount: true, status: true },
  });

  return ok({
    workerName: worker.name,
    workerRole: worker.role,
    payrollName: worker.payroll.name,
    payrollType: worker.payroll.payrollType,
    isOnboarded: worker.isOnboarded,
    milestones,
  });
}

/**
 * POST /api/worker/claim/[token]
 * Sends OTP to worker's phone for identity verification.
 * Body: { phone: string }
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/worker/claim/[token]">) {
  const { token } = await ctx.params;

  const worker = await prisma.worker.findUnique({ where: { claimToken: token } });
  if (!worker) return err("Invalid claim link", 404);
  if (worker.claimTokenExpiry && worker.claimTokenExpiry < new Date()) {
    return err("Claim link has expired", 410);
  }

  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const phone = body.phone?.trim();
  if (!phone) return err("Phone number is required", 400);

  // Verify this phone matches the worker's record
  const phoneHash = hashPhone(phone);
  if (worker.phoneHash !== phoneHash) {
    return err("Phone number does not match our records", 400);
  }

  const otp = generateOtp();
  await prisma.worker.update({
    where: { id: worker.id },
    data: { otpCode: otp, otpExpiry: otpExpiry() },
  });

  await sendOtp(phone, otp);

  return ok({ message: "OTP sent" });
}
