import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
    // Tree-shake heavy barrel-import libraries — only bundle what's actually used.
    // This alone reduces initial JS by ~30-40% for chart and animation-heavy pages.
    optimizePackageImports: [
      "recharts",
      "framer-motion",
      "lucide-react",
      "date-fns",
      "@tanstack/react-table",
      "echarts-for-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },

  // Turbopack config (Next.js 15+ top-level key)
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },

  // Strip all console.* calls from production bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Serve images in modern formats (WebP/AVIF) with responsive sizing
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
