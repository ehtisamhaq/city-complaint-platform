import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js Proxy (Edge)
 *
 * Gates the two authenticated areas before a request reaches a page:
 *
 *   /citizen/*  →  login, signup, dashboard
 *   /staff/*    →  login, dashboard
 *
 * The public routes (/, /complaints, /rag) are deliberately left out of the
 * matcher so this never runs on the common path.
 *
 * Access is derived from the SIGNED jwt_token, never from `user_info`. The
 * `user_info` cookie is plain JSON written by client-side script, so anyone can
 * rewrite `role` in it; treating it as an authz input would let a citizen walk
 * into the ops console. It is still forwarded for display purposes only (the
 * ADMIN/TECHNICIAN distinction lives there, not in the token).
 *
 * Everything fails closed: a missing, malformed, or expired token is simply
 * "anonymous", and an anonymous visitor can never reach a dashboard.
 */

type AccessClass = "staff" | "citizen" | "anonymous";

const AUTH_COOKIES = ["jwt_token", "user_info"] as const;

/** Decodes a JWT payload. Returns null for anything that is not a JWT. */
function decodeJwt(token: string): { sub?: string; exp?: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    // base64url → base64, then re-pad: atob rejects a truncated final group.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { sub?: string; exp?: number };
  } catch {
    return null;
  }
}

/**
 * Classifies a session from the token alone. The subject is minted by the
 * backend as "STAFF:<email>" or "CITIZEN:<email>" and covered by the JWT
 * signature, so this cannot be forged from the browser.
 */
function classify(token: string | undefined): AccessClass {
  if (!token) return "anonymous";

  const claims = decodeJwt(token);
  if (!claims) return "anonymous";

  // `exp` is in seconds. Treat an expired token as anonymous even though the
  // cookie is still attached — otherwise the page loads and every request
  // behind it fails.
  if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
    return "anonymous";
  }

  if (claims.sub?.startsWith("STAFF:")) return "staff";
  if (claims.sub?.startsWith("CITIZEN:")) return "citizen";
  return "anonymous";
}

function redirect(request: NextRequest, to: string, clearAuth = false) {
  const res = NextResponse.redirect(new URL(to, request.url));
  if (clearAuth) {
    for (const name of AUTH_COOKIES) {
      res.cookies.delete(name);
    }
  }
  return res;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("jwt_token")?.value;
  const access = classify(token);

  const isStaffArea = pathname.startsWith("/staff");
  const isCitizenArea = pathname.startsWith("/citizen");

  if (!isStaffArea && !isCitizenArea) {
    return NextResponse.next();
  }

  // The sign-in pages are the one place in each area an anonymous visitor is
  // allowed to be.
  const isSignIn = pathname.endsWith("/login") || pathname.endsWith("/signup");
  const loginPath = isStaffArea ? "/staff/login" : "/citizen/login";

  // Where a signed-in user of this class belongs.
  const dashboardFor = (cls: AccessClass) =>
    cls === "staff" ? "/staff/dashboard" : "/citizen/dashboard";

  if (access === "anonymous") {
    // Sign-in pages stay reachable; anything else bounces to login and drops a
    // token we could not use, so the next request starts from a clean slate.
    return isSignIn
      ? NextResponse.next()
      : redirect(request, loginPath, Boolean(token));
  }

  // Already signed in — the login form is not useful to them.
  if (isSignIn) {
    return redirect(request, dashboardFor(access));
  }

  // Wrong door: a staff member under /citizen/*, or a citizen under /staff/*.
  if (isStaffArea && access !== "staff") {
    return redirect(request, dashboardFor(access));
  }
  if (isCitizenArea && access !== "citizen") {
    return redirect(request, dashboardFor(access));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/citizen/:path*", "/staff/:path*"],
};
