import type { NextConfig } from "next";

// @ducanh2912/next-pwa fully supports Next.js 15/16 with Turbopack
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  // Required: declare turbopack config so Next.js 16 doesn't throw
  // a conflict error between the webpack config added by PWA and Turbopack
  turbopack: {},
  images: {
    // Allow blob URLs for image preview (local object URLs)
    dangerouslyAllowSVG: true,
    remotePatterns: [],
  },
};

export default withPWA(nextConfig);
