import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Satisfy Next.js 16 Turbopack requirement — next-pwa adds a webpack config,
  // so we must also declare a turbopack config (even if empty) to silence the error.
  turbopack: {},
  images: {
    // Allow blob URLs for image preview (local object URLs)
    dangerouslyAllowSVG: true,
    remotePatterns: [],
  },
};

export default withPWA(nextConfig);
