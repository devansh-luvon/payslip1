import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return err("Unauthorized", 401);

  if (session.role === "EMPLOYER") {
    const employer = await prisma.employer.findUnique({
      where: { id: session.id },
      select: {
        id: true, email: true, name: true, walletAddress: true,
        companyName: true, businessType: true, contactPerson: true,
        kybStatus: true, isApproved: true, createdAt: true,
      },
    });
    if (!employer) return err("Not found", 404);
    return ok(employer);
  }

  if (session.role === "WORKER") {
    const worker = await prisma.worker.findUnique({
      where: { id: session.id },
      select: {
        id: true, name: true, role: true, walletAddress: true,
        isOnboarded: true, payrollId: true,
      },
    });
    if (!worker) return err("Not found", 404);
    return ok(worker);
  }

  if (session.role === "ADMIN") {
    const admin = await prisma.admin.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, role: true },
    });
    if (!admin) return err("Not found", 404);
    return ok(admin);
  }

  return err("Unknown role", 400);
}
