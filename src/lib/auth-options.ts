// src/lib/auth-options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import { User } from "@/models/User";

/** Google OAuth profile fields used when auto-creating a user */
interface GoogleNameProfile {
  given_name?: string;
  family_name?: string;
}

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

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const googleConfigured = Boolean(googleClientId && googleClientSecret);

const authSecret =
  process.env.NEXTAUTH_SECRET?.trim() ||
  process.env.JWT_SECRET?.trim();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: authSecret,

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          }),
        ]
      : []),

    // ── Credentials (email + password) ───────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "И-мэйл", type: "email" },
        password: { label: "Нууц үг", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("И-мэйл болон нууц үг оруулна уу");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // ── Hardcoded admin ──────────────────────────
        const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@gmail.com").toLowerCase().trim();
        const adminPass  = (process.env.ADMIN_PASS ?? "TCB-757").trim();

        if (email === adminEmail && password === adminPass) {
          return {
            id: "admin-hardcoded",
            email: adminEmail,
            name: "Admin",
            role: "admin",
            isPremium: true,
            xp: 0,
            level: 1,
            coins: 9999,
            lives: 99,
            streak: 0,
            grade: undefined,
          };
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
    async signIn({ user, account, profile }) {
      // Google OAuth sign-in
      if (account?.provider === "google") {
        await connectDB();
        const email = user.email!.toLowerCase();

        let dbUser = await User.findOne({ email });
        const gp = profile as GoogleNameProfile | undefined;

        if (!dbUser) {
          // Auto-create from Google
          dbUser = await User.create({
            firstName: gp?.given_name ?? user.name?.split(" ")[0] ?? "Google",
            lastName: gp?.family_name ?? user.name?.split(" ")[1] ?? "User",
            email,
            googleId: account.providerAccountId,
            avatar: user.image,
            isVerified: true,
            role: "student",
          });
        } else if (!dbUser.googleId) {
          dbUser.googleId = account.providerAccountId;
          await dbUser.save();
        }

        await updateStreak(dbUser);

        user.id = dbUser._id.toString();
        user.role = dbUser.role;
        user.grade = typeof dbUser.grade === "number" ? dbUser.grade : undefined;
        user.isPremium = dbUser.isPremium;
        user.xp = dbUser.xp;
        user.level = dbUser.level;
        user.coins = dbUser.coins;
        user.lives = dbUser.lives;
        user.streak = dbUser.streak;
      }
      return true;
    },

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
