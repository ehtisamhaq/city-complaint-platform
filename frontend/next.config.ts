import type { NextConfig } from "next";

/**
 * Base URL of the Spring Boot service, with no /api suffix — the rewrite
 * appends it. Server-side only; it is never exposed to the browser bundle.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,

  // Forward every /api/* call to Spring Boot. The auth-gating half of the
  // request-time routing lives in src/proxy.ts; this is the HTTP forwarding.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
