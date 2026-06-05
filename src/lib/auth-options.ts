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
import { calcLevel } from "@/lib/gamification";

/** Mongoose user document fields used by streak logic */
interface UserDocForStreak {
  lastLoginDate?: Date;
  streak?: number;
  coins?: number;
  save(): Promise<unknown>;
}

// NEXTAUTH_URL-ийг энд process.env.NEXTAUTH_URL = ... гэж БҮТЭЭХ БОЛОХГҮЙ:
// Vercel дээр NEXTAUTH_URL=http://localhost:3000 байвал build үед код
// "http://localhost:3000" = ... болж compile алдаа өгнө.

const authSecret =
  process.env.NEXTAUTH_SECRET?.trim() ||
  process.env.JWT_SECRET?.trim();

const isDev = process.env.NODE_ENV !== "production";

function authLog(...args: unknown[]) {
  if (isDev) console.log(...args);
}

if (isDev) {
  authLog("[auth-options] NEXTAUTH_URL  =", process.env.NEXTAUTH_URL ?? "❌ NOT SET");
  authLog("[auth-options] NEXTAUTH_SECRET set?", authSecret ? "✅ YES" : "❌ NO");
  authLog("[auth-options] MONGODB_URI set?", process.env.MONGODB_URI ? "✅ YES" : "❌ NO");
}

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
        authLog("[authorize] called with email:", credentials?.email ?? "(empty)");

        if (!authSecret) {
          console.error("[authorize] ❌ NEXTAUTH_SECRET / JWT_SECRET тохируулаагүй!");
          throw new Error("Configuration");
        }
        if (!credentials?.email || !credentials?.password) {
          throw new Error("И-мэйл болон нууц үг оруулна уу");
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password.trim();

        // 1) Кодонд суулгасан admin — MongoDB-д upsert хийж, жинхэнэ _id буцаана
        if (isBuiltinAdminLogin(email, password)) {
          authLog("[authorize] built-in admin login attempt");
          try {
            await connectDB();
            authLog("[authorize] MongoDB холбогдлоо, admin upsert хийж байна...");
            const adminDoc = await User.findOneAndUpdate(
              { email: BUILTIN_ADMIN_EMAIL },
              {
                $set:      { role: "admin", isPremium: true, isVerified: true },
                $setOnInsert: {
                  firstName: "Admin",
                  lastName:  "",
                  email:     BUILTIN_ADMIN_EMAIL,
                  xp: 0, level: 1, coins: 9999, lives: 99, streak: 0,
                },
              },
              { upsert: true, new: true }
            );
            authLog("[authorize] ✅ admin upsert амжилттай, _id:", adminDoc._id.toString());
            return {
              id:        adminDoc._id.toString(),
              email:     adminDoc.email,
              name:      "Admin",
              role:      "admin" as const,
              isPremium: true,
              xp:        adminDoc.xp    ?? 0,
              level:     adminDoc.level ?? 1,
              coins:     adminDoc.coins ?? 9999,
              lives:     adminDoc.lives ?? 99,
              streak:    adminDoc.streak ?? 0,
              grade:     undefined as number | undefined,
            };
          } catch (err) {
            console.error("[authorize] ❌ MongoDB upsert алдаа:", err);
            authLog("[authorize] hardcoded fallback ашиглаж байна");
            return createAdminSessionUser(BUILTIN_ADMIN_EMAIL);
          }
        }

        // 2) Vercel env (нэмэлт, заавал биш)
        const envAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const envAdminPass = process.env.ADMIN_PASS?.trim();
        if (envAdminEmail && envAdminPass && email === envAdminEmail && password === envAdminPass) {
          authLog("[authorize] ✅ env admin login");
          return createAdminSessionUser(envAdminEmail);
        }

        // 3) MongoDB дээр role=admin (нууц үгээр)
        try {
          await connectDB();
          const dbAdmin = await User.findOne({ email, role: "admin" }).select("+password");
          if (dbAdmin?.password) {
            const ok = await bcrypt.compare(password, dbAdmin.password);
            if (ok) {
              authLog("[authorize] ✅ DB admin login");
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
        } catch (err) {
          console.error("[authorize] ❌ DB admin check алдаа:", err);
        }

        // 4) DB user (student/teacher)
        try {
          await connectDB();
        } catch (err) {
          console.error("[authorize] ❌ MongoDB холбогдож чадсангүй:", err);
          throw new Error("Серверийн өгөгдлийн сантай холбогдож чадсангүй (MONGODB_URI)");
        }

        const user = await User.findOne({ email }).select("+password");
        authLog("[authorize] DB user found?", user ? "✅ YES" : "❌ NO");

        if (!user) throw new Error("И-мэйл эсвэл нууц үг буруу байна");
        if (!user.isVerified) {
          authLog("[authorize] ❌ user not verified");
          throw new Error("Имэйл баталгаажуулна уу");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          authLog("[authorize] ❌ wrong password");
          throw new Error("И-мэйл эсвэл нууц үг буруу байна");
        }

        authLog("[authorize] ✅ student/teacher login success, role:", user.role);
        await recordLogin(user);

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          grade: typeof user.grade === "number" ? user.grade : undefined,
          isPremium: user.isPremium,
          xp: user.xp,
          level: calcLevel(user.xp ?? 0),
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
      if (trigger === "update" && session) {
        // Only allow safe display fields to be updated from the client.
        // Never allow role, id, or email to be overwritten.
        const allowed = ["name", "xp", "level", "coins", "lives", "streak", "isPremium", "grade"] as const;
        type AllowedKey = typeof allowed[number];
        const safe: Partial<Record<AllowedKey, unknown>> = {};
        for (const key of allowed) {
          if (key in session) safe[key] = (session as Record<string, unknown>)[key];
        }
        // Cast needed: JWT has an index signature but TypeScript can't infer it here
        return { ...token, ...safe } as typeof token;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.grade = token.grade as number | undefined;
        session.user.isPremium = token.isPremium as boolean;
        const xp = (token.xp as number) ?? 0;
        session.user.xp = xp;
        session.user.level = calcLevel(xp);
        session.user.coins = token.coins as number;
        session.user.lives = token.lives as number;
        session.user.streak = token.streak as number;
      }
      return session;
    },
  },
};

// ── Login (зоос/streak энд олгохгүй — зөвхөн /api/user/checkin) ─────────────
async function recordLogin(user: UserDocForStreak) {
  user.lastLoginDate = new Date();
  await user.save();
}
