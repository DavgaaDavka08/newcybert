// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    isPremium?: boolean;
    xp?: number;
    level?: number;
    coins?: number;
    lives?: number;
    streak?: number;
  }

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

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isPremium?: boolean;
    xp?: number;
    level?: number;
    coins?: number;
    lives?: number;
    streak?: number;
  }
}
