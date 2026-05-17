import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err, hashPhone, generateClaimToken, claimTokenExpiry } from "@/lib/utils";
import { sendClaimSms } from "@/lib/sms";

interface CsvWorker {
  name?: string;
  phone?: string;
  phoneNumber?: string;
  role?: string;
}

/** POST /api/payroll/[id]/workers — upload CSV-parsed workers JSON array */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/payroll/[id]/workers">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
  });
  if (!payroll) return err("Payroll not found", 404);
  if (payroll.status === "ACTIVE" || payroll.status === "COMPLETED") {
    return err("Cannot modify workers for an active payroll", 400);
  }

  let body: { workers: CsvWorker[] };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const { workers } = body;
  if (!Array.isArray(workers) || workers.length === 0) {
    return err("workers array is required", 400);
  }

  // Validate each row
  const invalid = workers.find((w) => !w.name || !(w.phone ?? w.phoneNumber));
  if (invalid) return err("Each worker must have name and phone fields", 400);

  // Remove existing draft workers if re-uploading
  await prisma.worker.deleteMany({
    where: { payrollId, payroll: { status: "DRAFT" } },
  });

  const created = await Promise.all(
    workers.map((w) => {
      const phone = (w.phone ?? w.phoneNumber ?? "").trim();
      return prisma.worker.create({
        data: {
          name: w.name!.trim(),
          role: w.role?.trim(),
          phoneHash: hashPhone(phone),
          payrollId,
          claimToken: generateClaimToken(),
          claimTokenExpiry: claimTokenExpiry(),
        },
      });
    })
  );

  return ok({ count: created.length, workers: created.map((w) => ({ id: w.id, name: w.name, role: w.role })) }, 201);
}

/** GET /api/payroll/[id]/workers */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/payroll/[id]/workers">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
  });
  if (!payroll) return err("Payroll not found", 404);

  const workers = await prisma.worker.findMany({
    where: { payrollId },
    select: {
      id: true, name: true, role: true, isOnboarded: true, walletAddress: true,
      _count: { select: { milestones: true } },
    },
  });

  return ok(workers);
}

/** POST /api/payroll/[id]/workers/notify — send claim SMS after payroll is funded */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/payroll/[id]/workers">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
    include: { workers: true },
  });
  if (!payroll) return err("Payroll not found", 404);
  if (payroll.status !== "ACTIVE") return err("Payroll must be ACTIVE to notify workers", 400);

  // Body contains phone numbers keyed by worker id for SMS sending
  let body: { workerPhones: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://payslip.app";
  let sent = 0;

  for (const worker of payroll.workers) {
    const phone = body.workerPhones[worker.id];
    if (phone && worker.claimToken) {
      const claimUrl = `${appUrl}/claim/${worker.claimToken}`;
      const totalAmount = payroll.totalAmount.toString();
      await sendClaimSms(phone, claimUrl, totalAmount).catch(console.error);
      sent++;
    }
  }

  return ok({ notified: sent });
}
