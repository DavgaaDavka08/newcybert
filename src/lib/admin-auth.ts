/** Built-in admin — Vercel env-ээс хамааралгүй үргэлж ажиллана */

export const BUILTIN_ADMIN_EMAIL = "admin@gmail.com";
export const BUILTIN_ADMIN_PASSWORD = "TCB-757";

export function isBuiltinAdminLogin(email: string, password: string): boolean {
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
