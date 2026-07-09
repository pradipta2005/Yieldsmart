import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow blob URLs for image preview (local object URLs)
    dangerouslyAllowSVG: true,
    remotePatterns: [],
  },
};

export default nextConfig;
