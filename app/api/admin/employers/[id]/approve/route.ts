import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
});

/** POST /api/admin/employers/[id]/approve — approve or reject employer KYB */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/employers/[id]/approve">) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return err("Unauthorized", 401);

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const employer = await prisma.employer.findUnique({ where: { id } });
  if (!employer) return err("Employer not found", 404);

  if (parsed.data.action === "APPROVE") {
    await prisma.employer.update({
      where: { id },
      data: { kybStatus: "APPROVED", isApproved: true },
    });
    return ok({ message: "Employer approved" });
  }

  // REJECT
  await prisma.employer.update({
    where: { id },
    data: { kybStatus: "REJECTED", isApproved: false },
  });
  return ok({ message: "Employer rejected" });
}
