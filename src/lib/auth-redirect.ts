/** Safe post-login redirect (prevents non-admins looping on /admin). */

export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  role?: string | null,
): string {
  if (role === "admin") return "/admin";

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  if (callbackUrl.startsWith("/admin")) {
    return "/dashboard";
  }

  return callbackUrl;
}

/** Poll session after credentials sign-in (cookie may lag one tick). */
export async function waitForSession(maxAttempts = 8, delayMs = 120) {
  const { getSession } = await import("next-auth/react");
  for (let i = 0; i < maxAttempts; i++) {
    const session = await getSession();
    if (session?.user) return session;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

export function mapAuthError(code: string | undefined): string {
  const map: Record<string, string> = {
    CredentialsSignin: "И-мэйл эсвэл нууц үг буруу байна",
    OAuthSignin: "Google нэвтрэлт амжилтгүй боллоо",
    OAuthCallback:
      "Google OAuth callback буруу байна. Google Console-д Vercel URL нэмнэ үү.",
    Configuration:
      "Серверийн тохиргоо дутуу байна (NEXTAUTH_SECRET, NEXTAUTH_URL).",
    AccessDenied: "Нэвтрэх эрхгүй байна",
    SessionRequired: "Эхлээд нэвтэрнэ үү",
  };
  if (!code) return "Нэвтрэлт амжилтгүй боллоо";
  return map[code] ?? "Нэвтрэлт амжилтгүй боллоо";
}
