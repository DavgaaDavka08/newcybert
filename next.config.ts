// next.config.ts
import type { NextConfig } from "next";

// On Vercel, VERCEL_URL is set automatically (without https://).
// If NEXTAUTH_URL is not explicitly configured, derive it from VERCEL_URL
// so NextAuth cookies, redirects, and OAuth callbacks work correctly in production.
const nextAuthUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: nextAuthUrl,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
