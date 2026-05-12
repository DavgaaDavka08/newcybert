// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isPremium: boolean;
      xp: number;
      level: number;
      coins: number;
      lives: number;
      streak: number;
    } & DefaultSession["user"];
  }
}
