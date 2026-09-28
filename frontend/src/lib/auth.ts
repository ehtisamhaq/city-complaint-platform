import type { User } from "@/lib/api";

/**
 * CLIENT-SIDE AUTH ACTIONS
 *
 * Each function posts to /api/auth/*, which the rewrite in next.config.ts
 * forwards to Spring Boot. The response carries the JWT; it is stored in
 * cookies here and cleared on logout. No localStorage, no context.
 *
 * The token is readable by script on purpose: `lib/api/client.ts` reads it back
 * to attach the Authorization header. The trade-off is that an XSS bug can
 * exfiltrate it. Making it httpOnly means the server has to set it, which
 * requires a same-origin Route Handler to do the token exchange instead of
 * this module.
 */

const ONE_DAY_SECONDS = 86400;

/**
 * `Secure` is applied automatically on https origins and left off on http, so
 * local development over http still receives the cookie.
 */
function cookieFlags(maxAge: number) {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  return `path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

// The linter flags every document.cookie write. These are deliberate: the
// token has to stay script-readable so lib/api/client.ts can build the
// Authorization header, and the user blob drives the navbar. See the note at
// the top of this file for the httpOnly trade-off.
// biome-ignore-start lint/suspicious/noDocumentCookie: token must be readable by the API client
function setAuthCookies(token: string, user: User) {
  if (typeof document === "undefined") return;
  const flags = cookieFlags(ONE_DAY_SECONDS);
  document.cookie = `jwt_token=${encodeURIComponent(token)}; ${flags}`;
  document.cookie = `user_info=${encodeURIComponent(JSON.stringify(user))}; ${flags}`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  const flags = cookieFlags(0);
  document.cookie = `jwt_token=; ${flags}`;
  document.cookie = `user_info=; ${flags}`;
  // biome-ignore-end lint/suspicious/noDocumentCookie: token must be readable by the API client
}

/** Mirrors the backend AuthResponse record. */
interface AuthEnvelope {
  success: boolean;
  message: string;
  data: {
    token?: string;
    user: User;
  };
}

async function post(path: string, body?: object): Promise<AuthEnvelope> {
  const res = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  return res.json();
}

export async function citizenLogin(
  email: string,
  password: string,
): Promise<User> {
  const payload = await post("citizen/login", { email, password });
  if (!payload.success) throw new Error(payload.message || "Login failed");
  if (payload.data?.token && payload.data?.user) {
    const user: User = {
      ...payload.data.user,
      role: payload.data.user.role || "CITIZEN",
    };
    setAuthCookies(payload.data.token, user);
    return user;
  }
  return payload.data.user;
}

export async function citizenSignup(data: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<User> {
  const payload = await post("citizen/signup", data);
  if (!payload.success) throw new Error(payload.message || "Signup failed");
  if (payload.data?.token && payload.data?.user) {
    const user: User = {
      ...payload.data.user,
      role: payload.data.user.role || "CITIZEN",
    };
    setAuthCookies(payload.data.token, user);
    return user;
  }
  return payload.data.user;
}

export async function staffLogin(
  email: string,
  password: string,
): Promise<User> {
  const payload = await post("staff/login", { email, password });
  if (!payload.success) throw new Error(payload.message || "Login failed");
  if (payload.data?.token && payload.data?.user) {
    setAuthCookies(payload.data.token, payload.data.user);
  }
  return payload.data.user;
}

export async function logout(): Promise<void> {
  // No server round-trip: the backend is stateless and exposes no
  // /api/auth/logout route, so a token stays valid until its 24h expiry.
  // Client-side logout is therefore a cookie clear; hard-navigating lets
  // proxy.ts re-evaluate cookie state on the next request.
  clearAuthCookies();
  window.location.href = "/";
}

/**
 * Read the non-httpOnly `user_info` cookie in the browser.
 * Returns null during SSR or when the user is not logged in.
 */
export function getClientUser(): User | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user_info=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as User;
  } catch {
    return null;
  }
}
