import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 Proxy / Middleware
 *
 * Runs on the Edge before a request completes. Handles:
 *  1. Auth-gating  – /citizen/dashboard and /staff/dashboard require a JWT cookie
 *  2. Role-routing – staff routes reject CITIZEN-role users, citizen routes reject staff users
 *  3. Post-auth redirect – logged-in users are bounced away from login/signup pages
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("jwt_token")?.value;
  const userInfoRaw = request.cookies.get("user_info")?.value;

  let role: string | undefined;
  if (userInfoRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userInfoRaw)) as {
        role?: string;
      };
      role = parsed.role;
    } catch {
      try {
        const parsed = JSON.parse(userInfoRaw) as { role?: string };
        role = parsed.role;
      } catch {
        /* ignore invalid cookie */
      }
    }
  }

  const isStaff =
    role === "ADMIN" ||
    role === "TECHNICIAN" ||
    (role !== undefined && role !== "CITIZEN");

  // ── 1. Guard /citizen/dashboard ──────────────────────────────────────────
  if (pathname.startsWith("/citizen/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/citizen/login", request.url));
    }
    if (isStaff) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
    // A token with no readable role cannot be trusted for a citizen session.
    if (role === undefined) {
      return NextResponse.redirect(new URL("/citizen/login", request.url));
    }
  }

  // ── 2. Guard /staff/dashboard ─────────────────────────────────────────────
  if (pathname.startsWith("/staff/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
    // Fail closed: a token whose role we cannot read is not a staff session.
    if (!isStaff) {
      return NextResponse.redirect(new URL("/citizen/login", request.url));
    }
  }

  // ── 3. Bounce authenticated users away from login / signup ────────────────
  const isAuthPage =
    pathname.startsWith("/citizen/login") ||
    pathname.startsWith("/citizen/signup") ||
    pathname.startsWith("/staff/login");

  if (isAuthPage && token) {
    const dest = isStaff ? "/staff/dashboard" : "/citizen/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

// Next.js 16 requires exactly one exported proxy function.
export default proxy;

export const config = {
  /*
   * Skip: Next.js internals, static assets, API routes, favicon.
   * Everything else passes through the proxy function above.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
