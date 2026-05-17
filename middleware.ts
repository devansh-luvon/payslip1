import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { SessionPayload } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);
const COOKIE_NAME = "ps_token";

async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Employer-protected routes ───────────────────────────────────────────
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding")
  ) {
    const session = await getSession(request);
    if (!session || session.role !== "EMPLOYER") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ── Worker-protected routes ─────────────────────────────────────────────
  if (pathname.startsWith("/worker/dashboard")) {
    const session = await getSession(request);
    if (!session || session.role !== "WORKER") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ── Admin-protected routes ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const session = await getSession(request);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/worker/dashboard/:path*",
    "/admin/:path*",
  ],
};
