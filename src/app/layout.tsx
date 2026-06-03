// src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Geist } from "next/font/google";
import "./globals.css";
import "./responsive.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

function metadataBaseUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      /* fall through */
    }
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: "CyberPhysics — Физикийг тоглоомоор сур",
  description: "AI тайлбар, XP систем, Duolingo загвартай физикийн платформ",
  openGraph: {
    title: "CyberPhysics",
    description: "Физикийг тоглоомоор сур",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={cn(jakarta.variable, inter.variable, "font-sans", geist.variable)}>
      <body className={jakarta.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
