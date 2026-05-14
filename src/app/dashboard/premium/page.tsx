"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";

const PLANS = [
  {
    id: "premium_monthly",
    label: "Premium Сар",
    price: "9,900₮",
    desc: "Бүх боломжоо нээ",
    icon: "⭐",
    color: T.purple,
    features: ["Хязгааргүй амь (∞)", "AI тайлбар", "Бүх сорил нээлттэй", "Зар байхгүй", "XP boost ×1.5", "Priority дэмжлэг"],
    badge: "Шилдэг",
  },
  {
    id: "premium_pro",
    label: "Premium Pro",
    price: "19,900₮",
    desc: "ЭЕШ-д 700+ оноо авах төлөвлөгөө",
    icon: "🏆",
    color: "#DC2626",
    features: ["Premium бүх зүйл", "Хувийн судалгааны төлөвлөгөө", "Алдааны шинжилгээ (AI)", "Сул сэдвийн тусгай давталт", "Монгол физикийн жишиг шалгалт", "Ахисан амжилтын дэвтэр"],
    badge: "700+ оноо",
  },
];

const COMPARE = [
  { feature: "Амь",           free: "5",     premium: "∞" },
  { feature: "Коин",          free: "Удаан",  premium: "Хурдан" },
  { feature: "AI тайлбар",    free: "❌",      premium: "✅" },
  { feature: "Тайлбар",       free: "Хэсэг",  premium: "Бүтэн" },
  { feature: "Зар",           free: "Байна",  premium: "Байхгүй" },
  { feature: "XP boost",      free: "×1",     premium: "×1.5" },
  { feature: "Судалгаа AI",   free: "❌",      premium: "✅" },
  { feature: "Шалгалт",       free: "Хязгаар", premium: "Хязгааргүй" },
];

export default function PremiumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePurchase(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: planId }),
      });
      const data = await res.json();
      if (data.qrImage || data.invoice) {
        setSuccess(planId);
      }
    } catch {}
    setLoading(null);
  }

  const isPremium = (session?.user as any)?.isPremium;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit" }}>
          <Ic n="chevLeft" size={16} /> Буцах
        </button>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>⭐ Premium</div>
        {isPremium && (
          <span style={{ background: T.purpleLight, color: T.purple, padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
            ✓ Идэвхтэй Premium
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontWeight: 900, fontSize: 34, color: T.text, letterSpacing: "-0.03em", marginBottom: 10, lineHeight: 1.2 }}>
            CyberPhysics <span style={{ background: "linear-gradient(90deg, #4F46E5, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Premium</span>
          </h1>
          <p style={{ fontSize: 15, color: T.textSub, maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
            Хязгааргүй амь, коин bonus, бүх сорил нээлттэй.
          </p>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 48, maxWidth: 640, margin: "0 auto 48px" }}>
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} loading={loading === plan.id} onBuy={() => handlePurchase(plan.id)} isPremium={isPremium && (plan.id === "premium_monthly" || plan.id === "premium_pro")} />
          ))}
        </div>

        {/* Feature comparison table */}
        <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.shadow, marginBottom: 48 }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Боломжуудын харьцуулалт</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Боломж</th>
                <th style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, fontWeight: 700, color: T.textSub, width: 120 }}>🆓 Үнэгүй</th>
                <th style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, fontWeight: 700, color: T.purple, width: 140, background: T.purpleLight }}>⭐ Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: T.text }}>{row.feature}</td>
                  <td style={{ padding: "12px 20px", textAlign: "center", fontSize: 13, color: T.muted }}>{row.free}</td>
                  <td style={{ padding: "12px 20px", textAlign: "center", fontSize: 13, fontWeight: 700, color: T.purple, background: T.purpleLight + "40" }}>{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function PlanCard({ plan, loading, onBuy, isPremium }: { plan: typeof PLANS[0]; loading: boolean; onBuy: () => void; isPremium: boolean }) {
  const [hov, setHov] = useState(false);
  const isHighlight = plan.id === "premium_monthly" || plan.id === "premium_pro";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: isHighlight ? `linear-gradient(160deg, ${plan.color}10, #fff)` : "#fff",
      borderRadius: 16, padding: "22px 18px",
      border: `2px solid ${hov || isHighlight ? plan.color : T.border}`,
      boxShadow: hov ? `0 8px 32px ${plan.color}22` : T.shadow,
      transition: "all 0.2s", position: "relative", display: "flex", flexDirection: "column",
    }}>
      {plan.badge && (
        <div style={{ position: "absolute", top: -10, right: 12, background: plan.color, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
          {plan.badge}
        </div>
      )}
      <div style={{ fontSize: 28, marginBottom: 10 }}>{plan.icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 4 }}>{plan.label}</div>
      <div style={{ fontWeight: 900, fontSize: 22, color: plan.color, marginBottom: 6, letterSpacing: "-0.02em" }}>{plan.price}</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.4 }}>{plan.desc}</div>
      <div style={{ flex: 1, marginBottom: 18 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: T.textSub, marginBottom: 6 }}>
            <span style={{ color: plan.color, fontWeight: 900, marginTop: 1, flexShrink: 0 }}>✓</span>
            {f}
          </div>
        ))}
      </div>
      {isPremium ? (
        <div style={{ padding: "10px", borderRadius: 10, background: T.greenLight, color: T.green, fontWeight: 700, fontSize: 13, textAlign: "center" }}>✓ Идэвхтэй</div>
      ) : (
        <button onClick={onBuy} disabled={loading} style={{
          width: "100%", padding: "11px", borderRadius: 10, border: "none",
          background: loading ? T.muted : plan.color, color: "#fff", fontWeight: 800, fontSize: 13,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "Plus Jakarta Sans, sans-serif",
          boxShadow: `0 4px 16px ${plan.color}33`,
          transition: "transform 0.15s",
          transform: hov && !loading ? "translateY(-1px)" : "none",
        }}>
          {loading ? "Уншиж байна..." : "Худалдан авах"}
        </button>
      )}
    </div>
  );
}
