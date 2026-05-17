import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const onboardingSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().min(2),
  businessType: z.string().min(2),
  contactPerson: z.string().min(2),
});

/** POST /api/employer/kyb — submit KYB step 1 (company info) */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const { name, companyName, businessType, contactPerson } = parsed.data;

  const employer = await prisma.employer.update({
    where: { id: session.id },
    data: { name, companyName, businessType, contactPerson, kybStatus: "PENDING" },
    select: { id: true, name: true, companyName: true, kybStatus: true },
  });

  return ok(employer);
}

/** PATCH /api/employer/kyb — upload KYB documents (simulated; real impl uses file storage) */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const { companyProofUrl, idVerificationUrl } = body as {
    companyProofUrl?: string;
    idVerificationUrl?: string;
  };

  if (!companyProofUrl || !idVerificationUrl) {
    return err("Both document URLs are required", 400);
  }

  await prisma.kybDocument.createMany({
    data: [
      { employerId: session.id, docType: "COMPANY_PROOF", fileUrl: companyProofUrl },
      { employerId: session.id, docType: "ID_VERIFICATION", fileUrl: idVerificationUrl },
    ],
  });

  return ok({ message: "KYB documents submitted. Pending review." });
}

/** GET /api/employer/kyb — current KYB status */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYER") return err("Unauthorized", 401);

  const employer = await prisma.employer.findUnique({
    where: { id: session.id },
    select: {
      kybStatus: true, isApproved: true,
      kybDocuments: { select: { docType: true, fileUrl: true, createdAt: true } },
    },
  });

  return ok(employer);
}
