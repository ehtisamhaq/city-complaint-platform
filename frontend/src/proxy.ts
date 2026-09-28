import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js Proxy / Middleware
 *
 * Runs on the Edge before a request completes. Handles:
 *  1. Auth-gating  – /citizen/dashboard and /staff/dashboard require a valid JWT cookie & role
 *  2. Role-routing – staff routes reject CITIZEN-role users, citizen routes reject staff users
 *  3. Post-auth redirect – validly logged-in users are bounced away from login/signup pages
 *  4. Loop prevention – clears invalid/orphan tokens if role is undefined.
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

  // Fallback: decode JWT payload if role is missing from cookie
  if (token && role === undefined) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadStr) as { sub?: string };
        if (payload.sub?.startsWith("STAFF:")) {
          role = "STAFF";
        } else if (payload.sub?.startsWith("CITIZEN:")) {
          role = "CITIZEN";
        }
      }
    } catch {
      /* ignore invalid token format */
    }
  }

  const isStaff =
    role === "ADMIN" ||
    role === "TECHNICIAN" ||
    (role !== undefined && role !== "CITIZEN");

  // ── 1. Guard /citizen/dashboard ──────────────────────────────────────────
  if (pathname.startsWith("/citizen/dashboard")) {
    if (!token || role === undefined) {
      const res = NextResponse.redirect(new URL("/citizen/login", request.url));
      res.cookies.delete("jwt_token");
      res.cookies.delete("user_info");
      return res;
    }
    if (isStaff) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
  }

  // ── 2. Guard /staff/dashboard ─────────────────────────────────────────────
  if (pathname.startsWith("/staff/dashboard")) {
    if (!token || role === undefined) {
      const res = NextResponse.redirect(new URL("/staff/login", request.url));
      res.cookies.delete("jwt_token");
      res.cookies.delete("user_info");
      return res;
    }
    // Fail closed: if not staff, redirect to citizen login and clear orphan cookies
    if (!isStaff) {
      const res = NextResponse.redirect(new URL("/citizen/login", request.url));
      res.cookies.delete("jwt_token");
      res.cookies.delete("user_info");
      return res;
    }
  }

  // ── 3. Bounce authenticated users away from login / signup ────────────────
  const isAuthPage =
    pathname.startsWith("/citizen/login") ||
    pathname.startsWith("/citizen/signup") ||
    pathname.startsWith("/staff/login");

  if (isAuthPage && token && role !== undefined) {
    const dest = isStaff ? "/staff/dashboard" : "/citizen/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
