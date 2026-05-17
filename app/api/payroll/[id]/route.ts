import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";

async function resolvePayroll(payrollId: string, employerId: string) {
  return prisma.payroll.findFirst({
    where: {
      id: payrollId,
      workspace: { employerId },
    },
    include: {
      workers: true,
      milestones: { include: { worker: { select: { id: true, name: true, role: true } } } },
      scheduledTasks: { include: { worker: { select: { id: true, name: true } } } },
      _count: { select: { workers: true, milestones: true } },
    },
  });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/payroll/[id]">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id } = await ctx.params;
  const payroll = await resolvePayroll(id, session.id);
  if (!payroll) return err("Payroll not found", 404);

  return ok(payroll);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/payroll/[id]">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id } = await ctx.params;
  const payroll = await resolvePayroll(id, session.id);
  if (!payroll) return err("Payroll not found", 404);
  if (payroll.status !== "DRAFT") return err("Only DRAFT payrolls can be deleted", 400);

  await prisma.payroll.delete({ where: { id } });
  return ok({ message: "Payroll deleted" });
}
