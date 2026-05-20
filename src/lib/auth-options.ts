// src/lib/auth-options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import { User } from "@/models/User";
import {
  BUILTIN_ADMIN_EMAIL,
  createAdminSessionUser,
  isBuiltinAdminLogin,
} from "./admin-auth";

/** Mongoose user document fields used by streak logic */
interface UserDocForStreak {
  lastLoginDate?: Date;
  streak?: number;
  coins?: number;
  save(): Promise<unknown>;
}

// Vercel: auto-set NEXTAUTH_URL when only VERCEL_URL is present
if (!process.env.NEXTAUTH_URL?.trim() && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

const authSecret =
  process.env.NEXTAUTH_SECRET?.trim() ||
  process.env.JWT_SECRET?.trim();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: authSecret,
  useSecureCookies: process.env.NODE_ENV === "production",

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "И-мэйл", type: "email" },
        password: { label: "Нууц үг", type: "password" },
      },
      async authorize(credentials) {
        if (!authSecret) {
          throw new Error("Configuration");
        }
        if (!credentials?.email || !credentials?.password) {
          throw new Error("И-мэйл болон нууц үг оруулна уу");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password.trim();

        // 1) Кодонд суулгасан admin — Vercel ADMIN_* буруу байсан ч ажиллана
        if (isBuiltinAdminLogin(email, password)) {
          return createAdminSessionUser(BUILTIN_ADMIN_EMAIL);
        }

        // 2) Vercel env (нэмэлт, заавал биш)
        const envAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const envAdminPass = process.env.ADMIN_PASS?.trim();
        if (envAdminEmail && envAdminPass && email === envAdminEmail && password === envAdminPass) {
          return createAdminSessionUser(envAdminEmail);
        }

        // 3) MongoDB дээр role=admin (нууц үгээр)
        try {
          await connectDB();
          const dbAdmin = await User.findOne({ email, role: "admin" }).select("+password");
          if (dbAdmin?.password) {
            const ok = await bcrypt.compare(password, dbAdmin.password);
            if (ok) {
              return {
                id: dbAdmin._id.toString(),
                email: dbAdmin.email,
                name: `${dbAdmin.firstName} ${dbAdmin.lastName}`.trim() || "Admin",
                role: "admin",
                grade: typeof dbAdmin.grade === "number" ? dbAdmin.grade : undefined,
                isPremium: dbAdmin.isPremium ?? true,
                xp: dbAdmin.xp ?? 0,
                level: dbAdmin.level ?? 1,
                coins: dbAdmin.coins ?? 0,
                lives: dbAdmin.lives ?? 99,
                streak: dbAdmin.streak ?? 0,
                image: dbAdmin.avatar,
              };
            }
          }
        } catch {
          /* MongoDB байхгүй бол доорх student login руу үргэлжлэнэ */
        }

        // ── DB user ──────────────────────────────────
        try {
          await connectDB();
        } catch {
          throw new Error("Серверийн өгөгдлийн сантай холбогдож чадсангүй (MONGODB_URI)");
        }
        const user = await User.findOne({ email }).select("+password");

        if (!user) throw new Error("И-мэйл эсвэл нууц үг буруу байна");
        if (!user.isVerified) throw new Error("Имэйл баталгаажуулна уу");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("И-мэйл эсвэл нууц үг буруу байна");

        // Update login streak
        await updateStreak(user);

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          grade: typeof user.grade === "number" ? user.grade : undefined,
          isPremium: user.isPremium,
          xp: user.xp,
          level: user.level,
          coins: user.coins,
          lives: user.lives,
          streak: user.streak,
          image: user.avatar,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.grade = user.grade;
        token.isPremium = user.isPremium;
        token.xp = user.xp;
        token.level = user.level;
        token.coins = user.coins;
        token.lives = user.lives;
        token.streak = user.streak;
      }
      // Allow updating session
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.grade = token.grade as number | undefined;
        session.user.isPremium = token.isPremium as boolean;
        session.user.xp = token.xp as number;
        session.user.level = token.level as number;
        session.user.coins = token.coins as number;
        session.user.lives = token.lives as number;
        session.user.streak = token.streak as number;
      }
      return session;
    },
  },
};

// ── Streak helper ────────────────────────────────────────────────────────────
async function updateStreak(user: UserDocForStreak) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastLogin = user.lastLoginDate
    ? new Date(
        user.lastLoginDate.getFullYear(),
        user.lastLoginDate.getMonth(),
        user.lastLoginDate.getDate()
      )
    : null;

  const diffDays = lastLogin
    ? Math.floor((today.getTime() - lastLogin.getTime()) / 86400000)
    : null;

  if (diffDays === null || diffDays > 1) {
    user.streak = 1;
  } else if (diffDays === 1) {
    user.streak = (user.streak ?? 0) + 1;
    // Streak bonus coins
    const bonus = Math.min(user.streak * 5, 50);
    user.coins = (user.coins ?? 0) + bonus;
  }
  // Login daily coin reward
  if (diffDays !== 0) {
    user.coins = (user.coins ?? 0) + 20;
  }

  user.lastLoginDate = now;
  await user.save();
}
