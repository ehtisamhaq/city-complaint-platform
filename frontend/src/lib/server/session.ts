/**
 * Server-side session helpers.
 *
 * The login flow writes two cookies: an httpOnly `jwt_token` and a readable
 * `user_info` blob. Both are available to Server Components, which is what
 * lets a dashboard render its header and counters without waiting on a
 * client-side fetch of the same information.
 */

import { cookies } from "next/headers";
import type { User } from "@/lib/api/types";

export interface Session {
  token: string;
  user: User;
}

/**
 * Returns the signed-in session, or null when there is no usable token.
 * `user_info` is only a convenience for rendering — the authoritative
 * credential is `jwt_token`, so a missing token wins over a stale blob.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();

  const token = store.get("jwt_token")?.value;
  if (!token) return null;

  const raw = store.get("user_info")?.value;
  if (!raw) return null;

  try {
    return { token, user: JSON.parse(decodeURIComponent(raw)) as User };
  } catch {
    return null;
  }
}
