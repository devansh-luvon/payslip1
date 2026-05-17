import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { z } from "zod";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["EMPLOYER", "ADMIN"]).default("EMPLOYER"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const { email, password, role } = parsed.data;

  if (role === "ADMIN") {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return err("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return err("Invalid credentials", 401);

    const token = await signToken({ id: admin.id, role: "ADMIN", email: admin.email });
    const cookieStore = await cookies();
    cookieStore.set("ps_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return ok({ id: admin.id, email: admin.email, role: admin.role });
  }

  // EMPLOYER login
  const employer = await prisma.employer.findUnique({ where: { email } });
  if (!employer) return err("Invalid credentials", 401);

  const valid = await bcrypt.compare(password, employer.passwordHash);
  if (!valid) return err("Invalid credentials", 401);

  const token = await signToken({ id: employer.id, role: "EMPLOYER", email: employer.email });
  const cookieStore = await cookies();
  cookieStore.set("ps_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return ok({
    id: employer.id,
    email: employer.email,
    name: employer.name,
    walletAddress: employer.walletAddress,
    kybStatus: employer.kybStatus,
    isApproved: employer.isApproved,
  });
}
