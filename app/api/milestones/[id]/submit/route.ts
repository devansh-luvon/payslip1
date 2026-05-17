import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  submissionUrl: z.string().url().optional(),
  submissionNote: z.string().max(1000).optional(),
});

/** POST /api/milestones/[id]/submit — worker submits a milestone for review */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/milestones/[id]/submit">) {
  const session = await getSession();
  if (!session || session.role !== "WORKER") return err("Unauthorized", 401);

  const { id: milestoneId } = await ctx.params;

  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, workerId: session.id },
  });
  if (!milestone) return err("Milestone not found", 404);
  if (milestone.status !== "PENDING_SUBMISSION" && milestone.status !== "REJECTED") {
    return err("Milestone cannot be submitted in its current state", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "SUBMITTED",
      submissionUrl: parsed.data.submissionUrl,
      submissionNote: parsed.data.submissionNote,
      submittedAt: new Date(),
      rejectionFeedback: null,
    },
  });

  return ok(updated);
}
