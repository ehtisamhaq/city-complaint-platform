import { type NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string[] }> },
) {
  const { action } = await params;
  const path = action.join("/");

  // Logout: clear both cookies locally, no backend call needed
  if (path === "logout") {
    const res = NextResponse.json({ success: true });
    res.cookies.set("jwt_token", "", { ...COOKIE, maxAge: 0 });
    res.cookies.set("user_info", "", { ...COOKIE, maxAge: 0, httpOnly: false });
    return res;
  }

  // Forward login / signup to Spring Boot
  const upstream = await fetch(`${BACKEND}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    cache: "no-store",
  });

  const payload = await upstream.json();

  if (!upstream.ok || !payload.success) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const { token, user } = payload.data as { token: string; user: object };

  const res = NextResponse.json(payload);

  // httpOnly – the JWT; JS can never read this
  res.cookies.set("jwt_token", token, COOKIE);

  // Non-httpOnly – display fields only (name, email, role); NOT the token
  res.cookies.set("user_info", JSON.stringify(user), {
    ...COOKIE,
    httpOnly: false,
  });

  return res;
}
