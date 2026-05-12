// src/app/dashboard/page.tsx
"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { id: "electricity", name: "Цахилгаан", icon: "⚡", color: "#FFD23F", levels: 5 },
  { id: "mechanics",   name: "Механик",   icon: "⚙️", color: "#5ECEBA", levels: 5 },
  { id: "optics",      name: "Оптик",     icon: "🔭", color: "#A78BFA", levels: 5 },
  { id: "thermal",     name: "Дулаан",    icon: "🌡️", color: "#FB923C", levels: 5 },
  { id: "magnetism",   name: "Соронзон",  icon: "🧲", color: "#34D399", levels: 5 },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role === "admin") router.replace("/admin");
  }, [status, session, router]);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#07070D", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
      Ачаалж байна...
    </div>
  );

  const user = session?.user;
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpProgress = xp % 100;
  const coins = user?.coins ?? 0;
  const lives = user?.lives ?? 5;
  const streak = user?.streak ?? 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#07070D",
      fontFamily: "Plus Jakarta Sans, sans-serif", color: "#E2E8F0",
    }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(7,7,13,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto", padding: "0 32px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>⚡ CyberPhysics</div>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {/* Stats pills */}
            {[
              { icon: "🔥", val: `${streak}`, label: "streak" },
              { icon: "❤️", val: `${lives}`, label: "lives" },
              { icon: "🪙", val: `${coins}`, label: "coins" },
            ].map(s => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                {s.icon} {s.val}
              </div>
            ))}

            <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
              padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "#64748B", cursor: "pointer", fontSize: 13,
            }}>Гарах</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 32px" }}>
        {/* Welcome + XP bar */}
        <div style={{
          background: "linear-gradient(135deg, #13131F 0%, #1A1A2E 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)",
          padding: "28px 32px", marginBottom: 28,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
                Сайн байна уу, {user?.name?.split(" ")[0] ?? "Сурагч"}! 👋
              </h1>
              <p style={{ color: "#64748B", fontSize: 14 }}>
                {streak > 0 ? `🔥 ${streak} өдрийн streak! Үргэлжлүүл!` : "Өнөөдөр тоглоё!"}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 6 }}>
                Level {level} — {xpProgress}/100 XP
              </div>
              <div style={{ width: 200, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  background: "linear-gradient(90deg, #FFD23F, #5ECEBA)",
                  width: `${xpProgress}%`, transition: "width 0.5s",
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Category cards */}
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Сэдвүүд</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{
              background: "#13131F", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)",
              padding: "24px 20px", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s",
              borderLeft: `3px solid ${cat.color}`,
            }}
              onClick={() => router.push(`/game?cat=${cat.id}&level=1`)}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{cat.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{cat.levels} level</div>

              <button style={{
                marginTop: 16, width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
                background: cat.color, color: "#07070D", fontWeight: 800, fontSize: 13, cursor: "pointer",
              }}>
                Эхлэх →
              </button>
            </div>
          ))}
        </div>

        {/* Premium banner */}
        {!user?.isPremium && (
          <div style={{
            borderRadius: 20, padding: "28px 32px",
            background: "linear-gradient(135deg, rgba(255,210,63,0.12) 0%, rgba(94,206,186,0.08) 100%)",
            border: "1px solid rgba(255,210,63,0.2)", display: "flex",
            justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20,
          }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
                ⭐ Premium-д шилжих
              </h3>
              <p style={{ color: "#94A3B8", fontSize: 14 }}>
                Хязгааргүй амь, AI тайлбар, XP boost болон бусад давуу тал авах
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Сарын Premium", price: "9,900₮" },
                { label: "Pro", price: "19,900₮" },
              ].map(plan => (
                <button key={plan.label} style={{
                  padding: "11px 20px", borderRadius: 12, border: "none",
                  background: "#FFD23F", color: "#07070D", fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}>
                  {plan.label} — {plan.price}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
