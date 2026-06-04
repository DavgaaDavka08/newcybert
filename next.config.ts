// next.config.ts
import type { NextConfig } from "next";

const nextAuthUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: nextAuthUrl,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer leakage control
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS (only meaningful over HTTPS / production)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline chunks + Cloudinary widget + WASM (dotlottie renderer)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://widget.cloudinary.com",
              // Styles: self + inline (Next.js injects inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Cloudinary + Google avatars + data URIs
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
              // Media (video/audio from Cloudinary)
              "media-src 'self' blob: https://res.cloudinary.com",
              // Web Workers (dotlottie renderer runs in a worker)
              "worker-src 'self' blob:",
              // Connections: API, Next-Auth, WebSocket, Lottie animation host
              `connect-src 'self' ${process.env.NEXT_PUBLIC_APP_URL ?? ""} ${process.env.NEXT_PUBLIC_SOCKET_URL ?? ""} https://api.cloudinary.com https://lottie.host wss:`,
              // Frames: deny all
              "frame-src 'none'",
              // Object embeds: deny
              "object-src 'none'",
              // Base URI restriction
              "base-uri 'self'",
              // Form action restriction
              "form-action 'self'",
            ]
              .filter(Boolean)
              .join("; "),
          },
        ],
      },
    ];
  },

  // Enable async WebAssembly for @lottiefiles/dotlottie-react
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any) {
    config.experiments = { ...(config.experiments ?? {}), asyncWebAssembly: true };
    return config;
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
