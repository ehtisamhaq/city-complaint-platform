import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Proxy /api/* to the Spring Boot backend.
  // The Next.js 16 proxy.ts (edge function) handles auth-gating;
  // this rewrite handles the actual HTTP forwarding.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
