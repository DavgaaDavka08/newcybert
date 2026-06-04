/**
 * Built-in admin credentials — env vars only, no hardcoded fallback.
 * Set ADMIN_EMAIL and ADMIN_PASS in your Vercel / .env.local.
 */

export const BUILTIN_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase().trim() ?? "";

const BUILTIN_ADMIN_PASSWORD = process.env.ADMIN_PASS?.trim() ?? "";

export function isBuiltinAdminLogin(email: string, password: string): boolean {
  if (!BUILTIN_ADMIN_EMAIL || !BUILTIN_ADMIN_PASSWORD) return false;
  return (
    email.toLowerCase().trim() === BUILTIN_ADMIN_EMAIL &&
    password.trim() === BUILTIN_ADMIN_PASSWORD
  );
}

export function createAdminSessionUser(email = BUILTIN_ADMIN_EMAIL) {
  return {
    id: "admin-hardcoded",
    email: email.toLowerCase().trim(),
    name: "Admin",
    role: "admin" as const,
    isPremium: true,
    xp: 0,
    level: 1,
    coins: 9999,
    lives: 99,
    streak: 0,
    grade: undefined as number | undefined,
  };
}
