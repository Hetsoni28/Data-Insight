import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on the same Wi-Fi to connect to HMR
  // Reduce memory pressure from Turbopack file watching
  experimental: {
    // @ts-ignore: Next.js types don't officially support 'turbo' under experimental yet
    turbo: {
      resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    },
  },

  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${process.env.BACKEND_URL || "http://localhost:8000"}/api/v1/:path*` },
      { source: "/datasets", destination: "/owner/dashboard/datasets" },
      { source: "/reports", destination: "/owner/dashboard/reports" },
      { source: "/monitoring", destination: "/owner/dashboard/monitoring" },
      { source: "/copilot", destination: "/owner/dashboard/ai" },
      { source: "/settings", destination: "/owner/dashboard/settings" },
    ];
  },
};

export default nextConfig;
