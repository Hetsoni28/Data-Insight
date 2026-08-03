import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on the same Wi-Fi to connect to HMR
  allowedDevOrigins: ["192.168.1.10"],
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: "http://localhost:8000/api/v1/:path*" },
      { source: "/datasets", destination: "/owner/dashboard/datasets" },
      { source: "/reports", destination: "/owner/dashboard/reports" },
      { source: "/monitoring", destination: "/owner/dashboard/monitoring" },
      { source: "/copilot", destination: "/owner/dashboard/ai" },
      { source: "/settings", destination: "/owner/dashboard/settings" },
    ];
  },
};

export default nextConfig;
