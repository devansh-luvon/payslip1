import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  tasks: z.array(
    z.object({
      name: z.string().min(2),
      amount: z.number().positive(),
      workerId: z.string().cuid(),
    })
  ).min(1),
});

/** POST /api/payroll/[id]/scheduled-tasks — bulk create scheduled tasks */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/payroll/[id]/scheduled-tasks">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
  });
  if (!payroll) return err("Payroll not found", 404);
  if (payroll.payrollType !== "SCHEDULED") return err("This payroll is not scheduled-type", 400);
  if (payroll.status !== "DRAFT") return err("Payroll is already funded", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const workerIds = [...new Set(parsed.data.tasks.map((t) => t.workerId))];
  const workers = await prisma.worker.findMany({ where: { id: { in: workerIds }, payrollId } });
  if (workers.length !== workerIds.length) return err("Some worker IDs are invalid", 400);

  await prisma.scheduledTask.deleteMany({ where: { payrollId } });

  const tasks = await prisma.scheduledTask.createMany({
    data: parsed.data.tasks.map((t) => ({
      name: t.name,
      amount: t.amount,
      workerId: t.workerId,
      payrollId,
    })),
  });

  const total = parsed.data.tasks.reduce((acc, t) => acc + t.amount, 0);
  await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      totalAmount: total,
      platformFee: parseFloat((total * 0.01).toFixed(7)),
    },
  });

  return ok({ count: tasks.count }, 201);
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/payroll/[id]/scheduled-tasks">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id: payrollId } = await ctx.params;

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, workspace: { employerId: session.id } },
  });
  if (!payroll) return err("Payroll not found", 404);

  const tasks = await prisma.scheduledTask.findMany({
    where: { payrollId },
    include: { worker: { select: { id: true, name: true } } },
  });

  return ok(tasks);
}
