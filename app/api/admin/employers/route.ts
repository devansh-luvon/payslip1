import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";

/** GET /api/admin/employers — list all employers with optional ?status= filter */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return err("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const employers = await prisma.employer.findMany({
    where: status ? { kybStatus: status as "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED" } : undefined,
    include: {
      kybDocuments: { select: { docType: true, fileUrl: true } },
      _count: { select: { workspaces: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(employers.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    companyName: e.companyName,
    businessType: e.businessType,
    contactPerson: e.contactPerson,
    walletAddress: e.walletAddress,
    kybStatus: e.kybStatus,
    isApproved: e.isApproved,
    kybDocuments: e.kybDocuments,
    workspacesCount: e._count.workspaces,
    createdAt: e.createdAt,
  })));
}
