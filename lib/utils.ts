import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { clsx, type ClassValue } from "clsx";

// ─── CSS class merging ────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Phone helpers ────────────────────────────────────────────────────────────

/** Hash a phone number for private storage. Normalise before hashing. */
export function hashPhone(phone: string): string {
  const normalised = phone.replace(/\s+/g, "").trim();
  return createHash("sha256").update(normalised).digest("hex");
}

/** Mask a phone number for display, e.g. +254712****89 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 6) return "****";
  return clean.slice(0, -4).replace(/.(?=.{4})/g, (c, i) => (i < 4 ? c : "*")) + clean.slice(-2);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function generateClaimToken(): string {
  return uuidv4().replace(/-/g, "");
}

export function claimTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30); // 30-day claim window
  return d;
}

// ─── Amount helpers ───────────────────────────────────────────────────────────

export function calculatePlatformFee(total: number): number {
  return parseFloat((total * 0.01).toFixed(7));
}

export function totalWithFee(total: number): number {
  return parseFloat((total + calculatePlatformFee(total)).toFixed(7));
}

export function formatUsdc(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── API response helpers ─────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function err(message: string, status = 400): Response {
  return Response.json({ success: false, error: message }, { status });
}
