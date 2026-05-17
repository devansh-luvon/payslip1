import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

/** GET /api/admin/payrolls — all payrolls across the platform */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return err("Unauthorized", 401);

  const payrolls = await prisma.payroll.findMany({
    include: {
      workspace: { include: { employer: { select: { id: true, name: true, email: true } } } },
      _count: { select: { workers: true, milestones: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(payrolls);
}

/** PATCH /api/admin/payrolls — freeze a payroll */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return err("Unauthorized", 401);

  const schema = z.object({
    payrollId: z.string().cuid(),
    action: z.enum(["FREEZE", "UNFREEZE"]),
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const payroll = await prisma.payroll.findUnique({ where: { id: parsed.data.payrollId } });
  if (!payroll) return err("Payroll not found", 404);

  await prisma.payroll.update({
    where: { id: parsed.data.payrollId },
    data: { status: parsed.data.action === "FREEZE" ? "FROZEN" : "ACTIVE" },
  });

  return ok({ message: `Payroll ${parsed.data.action === "FREEZE" ? "frozen" : "unfrozen"}` });
}
