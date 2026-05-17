import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const milestoneSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  amount: z.number().positive(),
  workerId: z.string().cuid(),
  expectedCompletion: z.string().datetime({ offset: true }).optional(),
});

const bulkSchema = z.object({
  milestones: z.array(milestoneSchema).min(1),
});

/** POST /api/payroll/[id]/milestones — bulk create milestones */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/payroll/[id]/milestones">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
  });
  if (!payroll) return err("Payroll not found", 404);
  if (payroll.payrollType !== "MILESTONE") return err("This payroll is not milestone-based", 400);
  if (payroll.status === "ACTIVE" || payroll.status === "COMPLETED") {
    return err("Cannot modify milestones of an active payroll", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  // Verify all workers belong to this payroll
  const workerIds = [...new Set(parsed.data.milestones.map((m) => m.workerId))];
  const workers = await prisma.worker.findMany({ where: { id: { in: workerIds }, payrollId } });
  if (workers.length !== workerIds.length) return err("Some worker IDs are invalid", 400);

  // Delete existing milestones for DRAFT payrolls (allow re-submission)
  await prisma.milestone.deleteMany({ where: { payrollId } });

  const milestones = await prisma.milestone.createMany({
    data: parsed.data.milestones.map((m) => ({
      name: m.name,
      description: m.description,
      amount: m.amount,
      workerId: m.workerId,
      payrollId,
      expectedCompletion: m.expectedCompletion ? new Date(m.expectedCompletion) : undefined,
      status: "LOCKED",
    })),
  });

  // Recalculate payroll total
  const total = parsed.data.milestones.reduce((acc, m) => acc + m.amount, 0);
  await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      totalAmount: total,
      platformFee: parseFloat((total * 0.01).toFixed(7)),
    },
  });

  return ok({ count: milestones.count }, 201);
}

/** GET /api/payroll/[id]/milestones */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/payroll/[id]/milestones">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
  });
  if (!payroll) return err("Payroll not found", 404);

  const milestones = await prisma.milestone.findMany({
    where: { payrollId },
    include: { worker: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return ok(milestones);
}
