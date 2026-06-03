"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { T } from "@/styles/tokens";
import { BackButton } from "@/components/ui/BackButton";

const PLANS = [
  {
    id: "premium_monthly",
    label: "Premium Сар",
    price: "9,900₮",
    desc: "Бүх хичээл, видео, шалгалт нээлттэй",
    icon: "⭐",
    color: T.purple,
    features: [
      "Хязгааргүй амь (∞)",
      "Бүх видео үнэгүй",
      "Бүх шалгалт үнэгүй",
      "Бүх ЕШ сорил үнэгүй",
      "XP boost ×1.5",
      "Premium Badge",
      "Сар бүр +50 бонус зоос",
    ],
    badge: "Шилдэг",
  },
  {
    id: "premium_pro",
    label: "Premium Pro",
    price: "19,900₮",
    desc: "ЕШ-д 700+ оноо авах төлөвлөгөө",
    icon: "🏆",
    color: "#DC2626",
    features: [
      "Premium бүх зүйл",
      "AI алдааны шинжилгээ",
      "Хувийн судалгааны төлөвлөгөө",
      "Сул сэдвийн тусгай давталт",
      "Монгол физикийн жишиг шалгалт",
      "Ахисан амжилтын дэвтэр",
    ],
    badge: "700+ оноо",
  },
];

// ── Зоосны багц ─────────────────────────────────────────────
const COIN_PACKS = [
  { id: "coins_50",  label: "50 Зоос",  price: "5,000₮",  coins: 50,  icon: "🟡", bonus: "" },
  { id: "coins_120", label: "120 Зоос", price: "10,000₮", coins: 120, icon: "🟡🟡", bonus: "+20 бонус" },
  { id: "coins_300", label: "300 Зоос", price: "20,000₮", coins: 300, icon: "💛", bonus: "+50 бонус", popular: true },
  { id: "coins_800", label: "800 Зоос", price: "50,000₮", coins: 800, icon: "👑", bonus: "+150 бонус" },
];

const COMPARE = [
  { feature: "Амь",              free: "5 (30мин тутам +1)",  premium: "∞ хязгааргүй" },
  { feature: "Видео",            free: "Өдөрт 1 үнэгүй",      premium: "Хязгааргүй" },
  { feature: "Шалгалт",         free: "Эхний 1 үнэгүй",       premium: "Хязгааргүй" },
  { feature: "ЕШ Сорил",        free: "Өдөрт 1 үнэгүй",      premium: "Хязгааргүй" },
  { feature: "XP boost",        free: "×1",                   premium: "×1.5" },
  { feature: "Бонус зоос",      free: "❌",                   premium: "+50/сар" },
  { feature: "Premium Badge",   free: "❌",                   premium: "✅" },
  { feature: "AI шинжилгээ",    free: "❌",                   premium: "✅" },
];

export default function PremiumPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [_purchaseOk, setPurchaseOk] = useState<string | null>(null);

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
        setPurchaseOk(planId);
      }
    } catch {}
    setLoading(null);
  }

  const isPremium = (session?.user as any)?.isPremium;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <BackButton href="/dashboard" label="Буцах" />
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
        <div className="premium-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 48, maxWidth: 640, margin: "0 auto 48px" }}>
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} loading={loading === plan.id} onBuy={() => handlePurchase(plan.id)} isPremium={isPremium && (plan.id === "premium_monthly" || plan.id === "premium_pro")} />
          ))}
        </div>

        {/* ── Coin Shop ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: T.text, marginBottom: 6 }}>🟡 Зоосны дэлгүүр</div>
            <div style={{ fontSize: 13, color: T.muted }}>Зоосоор видео нээх, шалгалт дахин өгөх, AI тайлбар авах</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {COIN_PACKS.map(pack => (
              <div key={pack.id} style={{
                background: pack.popular ? "linear-gradient(135deg, #FEF3C7, #FFFBEB)" : "#fff",
                borderRadius: 16, padding: "18px 16px", textAlign: "center",
                border: `2px solid ${pack.popular ? "#F59E0B" : T.border}`,
                boxShadow: pack.popular ? "0 4px 20px rgba(245,158,11,0.2)" : T.shadow,
                position: "relative",
              }}>
                {pack.popular && (
                  <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#F59E0B", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 12px", borderRadius: 20 }}>
                    Хамгийн алдартай
                  </div>
                )}
                <div style={{ fontSize: 28, marginBottom: 6 }}>{pack.icon}</div>
                <div style={{ fontWeight: 900, fontSize: 18, color: T.text, marginBottom: 2 }}>{pack.label}</div>
                {pack.bonus && <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginBottom: 8 }}>{pack.bonus}</div>}
                <div style={{ fontWeight: 800, fontSize: 16, color: "#4F46E5", marginBottom: 12 }}>{pack.price}</div>
                <button onClick={() => handlePurchase(pack.id)} style={{
                  width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
                  background: pack.popular ? "#F59E0B" : "#4F46E5", color: "#fff",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Авах
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Зоос хаана зарцуулах ── */}
        <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${T.border}`, padding: "20px 24px", marginBottom: 36, boxShadow: T.shadow }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 16 }}>🟡 Зоос яаж зарцуулах вэ?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {[
              { action: "Видео нээх", cost: 3, icon: "🎬" },
              { action: "AI тайлбар", cost: 3, icon: "🤖" },
              { action: "Шалгалт дахин", cost: 2, icon: "📝" },
              { action: "ЕШ дахин өгөх", cost: 2, icon: "📋" },
              { action: "Алхамт бодолт", cost: 2, icon: "🔢" },
              { action: "Full Heal (амь)", cost: 5, icon: "❤️" },
            ].map(item => (
              <div key={item.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.bg, borderRadius: 10 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.action}</div>
                  <div style={{ fontSize: 12, color: "#D97706", fontWeight: 700 }}>🟡 {item.cost} зоос</div>
                </div>
              </div>
            ))}
          </div>
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
