// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Runtime fix: set NEXTAUTH_URL from Vercel's deployment URL if not explicitly provided.
// next.config.ts `env` only inlines values into the client bundle — NextAuth reads
// process.env.NEXTAUTH_URL at server request time, so we must set it here.
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
