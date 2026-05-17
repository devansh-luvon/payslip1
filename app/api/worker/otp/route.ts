import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { ok, err, hashPhone } from "@/lib/utils";
import { generateKeypair, createWorkerAccount, addUsdcTrustline } from "@/lib/stellar";
import { encryptSecret } from "@/lib/sep30";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  claimToken: z.string().min(32),
  phone: z.string().min(7),
  otp: z.string().length(6),
});

/**
 * POST /api/worker/otp/verify
 *
 * Verifies OTP and:
 *  1. Creates a Stellar wallet for the worker (SEP-30 pattern).
 *  2. Funds it with base reserve XLM.
 *  3. Adds USDC trustline.
 *  4. Stores encrypted secret.
 *  5. Issues a worker JWT.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 400);

  const { claimToken, phone, otp } = parsed.data;

  const worker = await prisma.worker.findUnique({ where: { claimToken } });
  if (!worker) return err("Invalid session", 400);

  // Verify phone hash
  if (worker.phoneHash !== hashPhone(phone)) {
    return err("Phone mismatch", 400);
  }

  // Verify OTP
  if (!worker.otpCode || worker.otpCode !== otp) return err("Invalid OTP", 400);
  if (!worker.otpExpiry || worker.otpExpiry < new Date()) return err("OTP expired", 400);

  // Clear OTP
  await prisma.worker.update({
    where: { id: worker.id },
    data: { otpCode: null, otpExpiry: null },
  });

  // Create Stellar wallet if not already done
  if (!worker.walletAddress) {
    const { publicKey, secretKey } = generateKeypair();

    // Create account on-chain and add trustline
    await createWorkerAccount(publicKey);
    await addUsdcTrustline(secretKey);

    const encryptedSecret = encryptSecret(secretKey);

    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        walletAddress: publicKey,
        encryptedSecret,
        isOnboarded: true,
        claimToken: null,        // invalidate claim link
        claimTokenExpiry: null,
      },
    });
  } else {
    await prisma.worker.update({
      where: { id: worker.id },
      data: { isOnboarded: true, claimToken: null, claimTokenExpiry: null },
    });
  }

  const token = await signToken({ id: worker.id, role: "WORKER" });
  const cookieStore = await cookies();
  cookieStore.set("ps_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return ok({ workerId: worker.id, name: worker.name });
}
