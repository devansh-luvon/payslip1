import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  workspaceId: z.string().cuid(),
  payrollType: z.enum(["MILESTONE", "SCHEDULED"]),
  token: z.string().default("USDC"),
});

/** GET /api/payroll — list employer's payrolls (optional ?workspaceId=) */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const whereWorkspace = workspaceId
    ? { id: workspaceId, employerId: session.id }
    : { employerId: session.id };

  const workspaces = await prisma.workspace.findMany({ where: whereWorkspace, select: { id: true } });
  const wsIds = workspaces.map((w) => w.id);

  const payrolls = await prisma.payroll.findMany({
    where: { workspaceId: { in: wsIds } },
    include: { _count: { select: { workers: true, milestones: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(payrolls);
}

/** POST /api/payroll — create a new payroll */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  // Verify workspace belongs to employer
  const workspace = await prisma.workspace.findFirst({
    where: { id: parsed.data.workspaceId, employerId: session.id },
  });
  if (!workspace) return err("Workspace not found", 404);

  const employer = await prisma.employer.findUnique({ where: { id: session.id } });
  if (!employer?.isApproved) return err("KYB approval required", 403);

  const payroll = await prisma.payroll.create({
    data: {
      name: parsed.data.name,
      workspaceId: parsed.data.workspaceId,
      payrollType: parsed.data.payrollType,
      token: parsed.data.token,
      employerWallet: employer.walletAddress,
    },
  });

  return ok(payroll, 201);
}
