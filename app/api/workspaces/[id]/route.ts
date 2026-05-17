import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[id]">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id } = await ctx.params;

  const workspace = await prisma.workspace.findFirst({
    where: { id, employerId: session.id },
    include: {
      payrolls: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { workers: true, milestones: true } },
        },
      },
    },
  });

  if (!workspace) return err("Workspace not found", 404);
  return ok(workspace);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/workspaces/[id]">) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const { id } = await ctx.params;

  const workspace = await prisma.workspace.findFirst({ where: { id, employerId: session.id } });
  if (!workspace) return err("Workspace not found", 404);

  await prisma.workspace.delete({ where: { id } });
  return ok({ message: "Workspace deleted" });
}
