import type { User } from "@/lib/api";

/**
 * CLIENT-SIDE AUTH ACTIONS
 *
 * Each function calls the Next.js Route Handler at /api/auth/*
 * which proxies to Spring Boot and sets the httpOnly jwt_token cookie
 * + the readable user_info cookie. No localStorage, no context.
 */

function setAuthCookies(token: string, user: User) {
  if (typeof document === "undefined") return;
  const maxAge = 86400; // 24 hours
  document.cookie = `jwt_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `user_info=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `jwt_token=; path=/; max-age=0`;
  document.cookie = `user_info=; path=/; max-age=0`;
}

async function post(
  path: string,
  body?: object,
): Promise<{ success: boolean; message: string; data: any }> {
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
  return payload.data.user as User;
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
  return payload.data.user as User;
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
  return payload.data.user as User;
}

export async function logout(): Promise<void> {
  try {
    await post("logout");
  } catch {
    // Ignore backend logout errors if token already invalid
  }
  clearAuthCookies();
  // Hard-navigate so proxy.ts re-evaluates cookie state on next request
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
