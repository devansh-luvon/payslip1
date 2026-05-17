import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { z } from "zod";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  walletAddress: z.string().min(56, "Invalid Stellar wallet address"),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.errors[0].message, 400);
  }

  const { email, password, walletAddress, name } = parsed.data;

  const existing = await prisma.employer.findFirst({
    where: { OR: [{ email }, { walletAddress }] },
  });

  if (existing) {
    if (existing.email === email) return err("Email already registered", 409);
    return err("Wallet address already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const employer = await prisma.employer.create({
    data: { email, passwordHash, walletAddress, name },
  });

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
  }, 201);
}
