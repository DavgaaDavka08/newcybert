"use client";
import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { T } from "@/styles/tokens";
import { SubpageShell } from "@/components/layout/SubpageShell";
import {
  PremiumPaymentModal,
  type PaymentCheckoutData,
} from "@/components/premium/PremiumPaymentModal";
import {
  PremiumPaymentCard,
  type BankTransferInfo,
} from "@/components/payment/PremiumPaymentCard";
import {
  PREMIUM_FEATURES,
  PREMIUM_SAVINGS,
  formatMnt,
  perMonthPrice,
  PREMIUM_PRICES,
  type PremiumPlanType,
} from "@/lib/premium-pricing";

type PlanCardData = {
  type: PremiumPlanType;
  label: string;
  price: string;
  perMonth: string;
  savings?: string;
  badge?: string;
  popular?: boolean;
  icon: string;
  color: string;
};

const PLANS: PlanCardData[] = [
  {
    type: "monthly",
    label: "Сарын",
    price: formatMnt(PREMIUM_PRICES.monthly.amount),
    perMonth: `Сард ${formatMnt(perMonthPrice("monthly"))}`,
    icon: "⭐",
    color: T.purple,
  },
  {
    type: "quarterly",
    label: "3 сар",
    price: formatMnt(PREMIUM_PRICES.quarterly.amount),
    perMonth: `Сард ${formatMnt(perMonthPrice("quarterly"))}`,
    savings: PREMIUM_SAVINGS.quarterly
      ? `${formatMnt(PREMIUM_SAVINGS.quarterly)} хэмнэнэ`
      : undefined,
    badge: "Хэмнэлттэй",
    icon: "💎",
    color: "#4F46E5",
  },
  {
    type: "annual",
    label: "Жилийн",
    price: formatMnt(PREMIUM_PRICES.annual.amount),
    perMonth: `Сард ${formatMnt(perMonthPrice("annual"))}`,
    savings: PREMIUM_SAVINGS.annual
      ? `${formatMnt(PREMIUM_SAVINGS.annual)} хэмнэнэ`
      : undefined,
    badge: "Хамгийн өргөн",
    popular: true,
    icon: "👑",
    color: "#D97706",
  },
];

function PremiumPageInner() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState<PremiumPlanType | null>(null);
  const [payError, setPayError] = useState("");

  // ── QPay / KhanBank modal (kept for backward-compat) ─────────
  const [checkout, setCheckout] = useState<PaymentCheckoutData | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  // ── Bank transfer modal ───────────────────────────────────────
  const [bankInfo, setBankInfo] = useState<BankTransferInfo | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // On mount: restore existing pending/waiting payment so user doesn't lose their code
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/payment/me", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: {
        payments?: { _id: string; status: string; paymentCode?: string; amount: number; type?: string; receiptImage?: string }[];
        bankInfo?: { bankName: string; accountNumber: string; accountHolder: string };
      } | null) => {
        if (!data?.payments?.length) return;
        const active = data.payments.find(
          (p) => p.status === "pending" || p.status === "waiting_verification"
        );
        if (!active) return;
        const planType = active.type?.includes("annual")
          ? "annual"
          : active.type?.includes("quarterly")
          ? "quarterly"
          : "monthly";
        const pricing = PREMIUM_PRICES[planType as PremiumPlanType] ?? PREMIUM_PRICES.monthly;
        setBankInfo((prev) => prev ? prev : {
          paymentId: active._id,
          paymentCode: active.paymentCode ?? "",
          amount: active.amount,
          plan: planType,
          months: pricing.months,
          bankName: data.bankInfo?.bankName ?? "ХААН Банк",
          accountNumber: data.bankInfo?.accountNumber ?? "",
          accountHolder: data.bankInfo?.accountHolder ?? "",
          status: active.status as BankTransferInfo["status"],
          receiptImage: active.receiptImage ?? "",
        });
      })
      .catch(() => null);
  }, [session?.user?.id]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const id = searchParams.get("id");
    if (payment === "success") {
      void updateSession?.();
      setPayError("");
    } else if (payment === "failed") {
      setPayError("Төлбөр цуцлагдсан эсвэл амжилтгүй.");
    } else if (payment === "pending" && id) {
      // Legacy QPay pending redirect
      setCheckout({
        paymentId: id,
        provider: "khan_bank",
        amount: 0,
        qrImage: null,
        qrText: null,
        formUrl: null,
        shortUrl: null,
        bankUrls: [],
      });
      setPayModalOpen(true);
    }
  }, [searchParams, updateSession]);

  /** Bank transfer flow — primary payment method */
  async function handlePurchase(planType: PremiumPlanType) {
    setLoading(planType);
    setPayError("");
    try {
      const res = await fetch("/api/payment/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType }),
      });
      const data = await res.json() as {
        ok?: boolean;
        existing?: boolean;
        paymentId?: string;
        paymentCode?: string;
        amount?: number;
        plan?: string;
        months?: number;
        bankName?: string;
        accountNumber?: string;
        accountHolder?: string;
        status?: string;
        receiptImage?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setPayError(data.error ?? "Төлбөр үүсгэхэд алдаа гарлаа");
        return;
      }
      setBankInfo({
        paymentId: data.paymentId ?? "",
        paymentCode: data.paymentCode ?? "",
        amount: data.amount ?? 0,
        plan: data.plan ?? planType,
        months: data.months ?? 1,
        bankName: data.bankName ?? "ХААН Банк",
        accountNumber: data.accountNumber ?? "",
        accountHolder: data.accountHolder ?? "",
        status: (data.status as BankTransferInfo["status"]) ?? "pending",
        receiptImage: data.receiptImage ?? "",
      });
      setBankModalOpen(true);
    } catch {
      setPayError("Сүлжээний алдаа. Дахин оролдоно уу.");
    }
    setLoading(null);
  }

  const isPremium = (session?.user as { isPremium?: boolean })?.isPremium;

  return (
    <SubpageShell>
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div
        style={{
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>⭐ Premium</div>
        {isPremium && (
          <span
            style={{
              background: T.purpleLight,
              color: T.purple,
              padding: "4px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✓ Идэвхтэй Premium
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontWeight: 900,
              fontSize: 34,
              color: T.text,
              letterSpacing: "-0.03em",
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            CyberPhysics{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #4F46E5, #7C3AED)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Premium
            </span>
          </h1>
          <p style={{ fontSize: 15, color: T.textSub, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Сар, 3 сар эсвэл жилээр сонгоод хязгааргүй суралцаарай.
            Банкны шилжүүлгээр төлж, баримтаа байршуулаарай.
          </p>
          {/* Restore existing pending payment banner */}
          {bankInfo && !bankModalOpen && (bankInfo.status === "pending" || bankInfo.status === "waiting_verification") && (
            <div style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: bankInfo.status === "waiting_verification" ? "#DBEAFE" : "#FEF3C7",
              border: `1px solid ${bankInfo.status === "waiting_verification" ? "#93C5FD" : "#FCD34D"}`,
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 13,
              color: bankInfo.status === "waiting_verification" ? "#1D4ED8" : "#92400E",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => setBankModalOpen(true)}
            >
              {bankInfo.status === "waiting_verification"
                ? "📬 Баримтыг шалгаж байна — харах →"
                : `⏳ Хүлээгдэж буй төлбөр: ${bankInfo.paymentCode} — үргэлжлүүлэх →`}
            </div>
          )}

          {payError && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "#DC2626",
                maxWidth: 420,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {payError}
            </p>
          )}
          {searchParams.get("payment") === "success" && (
            <p
              style={{
                marginTop: 12,
                fontSize: 14,
                fontWeight: 700,
                color: T.green,
              }}
            >
              ✓ Төлбөр амжилттай — Premium идэвхтэй!
            </p>
          )}
        </div>

        <div
          className="premium-plans-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 48,
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.type}
              plan={plan}
              loading={loading === plan.type}
              onBuy={() => handlePurchase(plan.type)}
              isPremium={Boolean(isPremium)}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .premium-plans-grid {
            grid-template-columns: 1fr !important;
            max-width: 400px;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }
      `}      </style>

      {/* QPay / KhanBank modal — kept for legacy redirects */}
      <PremiumPaymentModal
        open={payModalOpen}
        checkout={checkout}
        onClose={() => {
          setPayModalOpen(false);
          setCheckout(null);
        }}
        onSuccess={() => {
          void updateSession?.();
          router.replace("/dashboard/premium?payment=success");
        }}
      />

      {/* Bank transfer modal */}
      {bankModalOpen && bankInfo && (
        <div
          onClick={() => setBankModalOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PremiumPaymentCard
              info={bankInfo}
              onClose={() => setBankModalOpen(false)}
              onReceiptUploaded={() => {
                void updateSession?.();
              }}
              onApproved={() => {
                void updateSession?.();
                router.replace("/dashboard/premium?payment=success");
              }}
            />
          </div>
        </div>
      )}
    </div>
    </SubpageShell>
  );
}

function PlanCard({
  plan,
  loading,
  onBuy,
  isPremium,
}: {
  plan: PlanCardData;
  loading: boolean;
  onBuy: () => void;
  isPremium: boolean;
}) {
  const [hov, setHov] = useState(false);
  const borderColor = plan.popular ? "#D97706" : hov ? plan.color : T.border;
  const borderWidth = plan.popular ? 3 : 2;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: plan.popular
          ? "linear-gradient(160deg, #FFFBEB 0%, #fff 55%)"
          : hov
            ? `linear-gradient(160deg, ${plan.color}10, #fff)`
            : "#fff",
        borderRadius: 18,
        padding: "24px 20px",
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: plan.popular
          ? "0 12px 40px rgba(217, 119, 6, 0.18)"
          : hov
            ? `0 8px 32px ${plan.color}22`
            : T.shadow,
        transition: "all 0.2s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        transform: plan.popular && hov ? "translateY(-2px)" : "none",
      }}
    >
      {plan.popular && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, #F59E0B, #D97706)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 14px",
            borderRadius: 99,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(217, 119, 6, 0.35)",
          }}
        >
          Хамгийн алдартай
        </div>
      )}
      {plan.badge && !plan.popular && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: 12,
            background: plan.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            padding: "3px 10px",
            borderRadius: 99,
          }}
        >
          {plan.badge}
        </div>
      )}
      {plan.badge && plan.popular && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: 12,
            background: plan.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            padding: "3px 10px",
            borderRadius: 99,
          }}
        >
          {plan.badge}
        </div>
      )}

      <div style={{ fontSize: 32, marginBottom: 8 }}>{plan.icon}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 4 }}>{plan.label}</div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 28,
          color: plan.color,
          marginBottom: 4,
          letterSpacing: "-0.03em",
        }}
      >
        {plan.price}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.textSub, marginBottom: plan.savings ? 4 : 12 }}>
        {plan.perMonth}
      </div>
      {plan.savings && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#059669",
            background: "#ECFDF5",
            padding: "6px 10px",
            borderRadius: 8,
            marginBottom: 14,
            display: "inline-block",
            alignSelf: "flex-start",
          }}
        >
          {plan.savings}
        </div>
      )}

      <div style={{ flex: 1, marginBottom: 20, marginTop: plan.savings ? 0 : 4 }}>
        {PREMIUM_FEATURES.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 12,
              color: T.textSub,
              marginBottom: 7,
            }}
          >
            <span style={{ color: plan.color, fontWeight: 900, flexShrink: 0 }}>✓</span>
            {f}
          </div>
        ))}
      </div>

      {isPremium ? (
        <div
          style={{
            padding: "11px",
            borderRadius: 10,
            background: T.greenLight,
            color: T.green,
            fontWeight: 700,
            fontSize: 13,
            textAlign: "center",
          }}
        >
          ✓ Идэвхтэй
        </div>
      ) : (
        <button
          onClick={onBuy}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "none",
            background: loading ? T.muted : plan.color,
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            boxShadow: `0 4px 16px ${plan.color}33`,
          }}
        >
          {loading ? "Уншиж байна..." : "Худалдан авах"}
        </button>
      )}
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={null}>
      <PremiumPageInner />
    </Suspense>
  );
}
