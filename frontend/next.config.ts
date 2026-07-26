import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile devices on the same Wi-Fi to connect to HMR
  allowedDevOrigins: ["192.168.1.10"],
};

export default nextConfig;
