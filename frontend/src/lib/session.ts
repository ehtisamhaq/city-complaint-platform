import { cookies } from "next/headers";
import type { User } from "@/lib/api";

/**
 * SERVER-SIDE SESSION
 * Call from Server Components, Route Handlers, or Server Actions.
 *
 * Returns the user decoded from the `user_info` cookie (set by the auth
 * Route Handler) and the raw JWT from the httpOnly `jwt_token` cookie.
 */
export async function getServerSession(): Promise<{
  user: User | null;
  token: string | null;
}> {
  const jar = await cookies();
  const token = jar.get("jwt_token")?.value ?? null;
  const rawUser = jar.get("user_info")?.value ?? null;

  let user: User | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as User;
    } catch {
      /* malformed – ignore */
    }
  }

  return { user, token };
}
