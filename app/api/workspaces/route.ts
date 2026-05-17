import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

/** GET /api/workspaces — list employer's workspaces */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const workspaces = await prisma.workspace.findMany({
    where: { employerId: session.id },
    include: {
      _count: { select: { payrolls: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(workspaces);
}

/** POST /api/workspaces — create a workspace */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  // Only approved employers can create workspaces
  const employer = await prisma.employer.findUnique({ where: { id: session.id } });
  if (!employer?.isApproved) return err("Your KYB must be approved before creating a workspace", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = z.object({ name: z.string().min(2) }).safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const workspace = await prisma.workspace.create({
    data: { name: parsed.data.name, employerId: session.id },
  });

  return ok(workspace, 201);
}
