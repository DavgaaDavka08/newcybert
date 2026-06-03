"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { BackButton } from "@/components/ui/BackButton";
import { useAppState } from "@/lib/app-state-context";

const EXAM_COIN_COST = 6;

interface Exam {
  _id: string; title: string; description?: string;
  duration: number; questions: { id: string }[];
  hasAttempt: boolean; createdAt: string;
}

export default function ExamListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [spending, setSpending] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const { appState, setAppState } = useAppState();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/exam/exams")
      .then(r => r.json())
      .then(data => { setExams(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  async function handleConfirmStart() {
    if (!selectedExam) return;
    setErrMsg("");

    // Premium хэрэглэгч — зоос зарцуулахгүй, шууд нээнэ
    if (appState.isPremium) {
      router.push(`/dashboard/exam/${selectedExam._id}`);
      return;
    }

    setSpending(true);
    try {
      const res = await fetch("/api/user/spend-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exam_start" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error ?? "Алдаа гарлаа");
        setSpending(false);
        return;
      }
      setAppState((s: typeof appState) => ({ ...s, coins: data.coins }));
      router.push(`/dashboard/exam/${selectedExam._id}`);
    } catch {
      setErrMsg("Сүлжээний алдаа гарлаа");
      setSpending(false);
    }
  }

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      Ачаалж байна...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackButton href="/dashboard" label="Буцах" />
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Шалгалтууд</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {appState.isPremium && (
            <span style={{ background: "#FEF3C7", color: "#D97706", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              ⭐ Premium
            </span>
          )}
          <span style={{ fontSize: 13, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            🟡 {appState.coins} зоос
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(120deg, #1e3a8a 0%, #4F46E5 100%)", borderRadius: 18, padding: "24px 28px", marginBottom: 28, color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.25)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Шалгалтын систем</div>
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Шалгалт өгч мэдлэгээ шалга</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            {appState.isPremium
              ? "✅ Premium — бүх шалгалт үнэгүй нээлттэй"
              : `Шалгалт нэг бүр ${EXAM_COIN_COST} зоос зарцуулна. Хугацаатай асуултуудад хариулж, үр дүнгээ шууд харна уу.`}
          </div>
        </div>

        {/* Exam list */}
        {exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: T.muted }}>
            <Ic n="task" size={40} color={T.muted} style={{ marginBottom: 12, opacity: 0.45 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Шалгалт байхгүй байна</div>
            <div style={{ fontSize: 13 }}>Admin шинэ шалгалт нэмэхийг хүлээнэ үү</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {exams.map((exam) => (
              <ExamCard
                key={exam._id}
                exam={exam}
                isPremium={appState.isPremium}
                coinCost={EXAM_COIN_COST}
                onStart={() => {
                  if (exam.hasAttempt) {
                    router.push(`/dashboard/exam/${exam._id}`);
                  } else {
                    setSelectedExam(exam);
                    setErrMsg("");
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coin confirm modal */}
      {selectedExam && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#1a1f2e", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 400,
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)", position: "relative", color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            {/* Close */}
            <button onClick={() => { setSelectedExam(null); setErrMsg(""); }} style={{
              position: "absolute", top: 14, right: 14, width: 32, height: 32,
              borderRadius: 8, border: "none", background: "#ef4444", color: "#fff",
              fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
            }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Сорил эхлүүлэх үү?</div>
              {appState.isPremium ? (
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  Premium эрхтэй тул үнэгүй эхлүүлнэ.
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  Бүтэн сорилыг эхлүүлэхэд<br />
                  <strong style={{ color: "#fff", fontSize: 16 }}>{EXAM_COIN_COST} зоос зарцуулна.</strong>
                </div>
              )}
            </div>

            {/* Info rows */}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow icon="🟡" label={`Үнэ: ${appState.isPremium ? "үнэгүй (Premium)" : `${EXAM_COIN_COST} зоос`}`} />
              <InfoRow icon="⏱️" label={`Хугацаа: ${selectedExam.duration} мин`} />
              <InfoRow icon="📝" label={`Асуулт: ${selectedExam.questions?.length ?? 0}`} />
              {!appState.isPremium && (
                <InfoRow
                  icon="💛"
                  label={`Үлдэгдэл: ${appState.coins - EXAM_COIN_COST} зоос`}
                  warn={appState.coins < EXAM_COIN_COST}
                />
              )}
            </div>

            {errMsg && (
              <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>
                {errMsg}
                {errMsg.includes("хүрэлцэхгүй") && (
                  <button
                    onClick={() => router.push("/dashboard/premium")}
                    style={{ display: "block", margin: "8px auto 0", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Зоос авах →
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setSelectedExam(null); setErrMsg(""); }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >
                Болих
              </button>
              {!appState.isPremium && appState.coins < EXAM_COIN_COST ? (
                <button
                  onClick={() => router.push("/dashboard/premium")}
                  style={{ flex: 1.5, padding: "12px 0", borderRadius: 12, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
                >
                  🟡 Зоос авах
                </button>
              ) : (
                <button
                  onClick={handleConfirmStart}
                  disabled={spending}
                  style={{ flex: 1.5, padding: "12px 0", borderRadius: 12, border: "none", background: spending ? "#555" : "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: spending ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  {spending ? "Уншиж байна..." : appState.isPremium ? "✅ Эхлэх" : `🟡 ${EXAM_COIN_COST} зоос зарцуулах`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, warn }: { icon: string; label: string; warn?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span>{icon}</span>
      <span style={{ color: warn ? "#f87171" : "rgba(255,255,255,0.8)", fontWeight: warn ? 700 : 400 }}>{label}</span>
    </div>
  );
}

function ExamCard({ exam, isPremium, coinCost, onStart }: { exam: Exam; isPremium: boolean; coinCost: number; onStart: () => void }) {
  const [hov, setHov] = useState(false);
  const done = exam.hasAttempt;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: "#fff", borderRadius: 14,
      border: `1.5px solid ${hov && !done ? "#4F46E5" : T.border}`,
      padding: "20px 22px",
      boxShadow: hov ? "0 4px 20px rgba(79,70,229,0.12)" : T.shadow,
      transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: done ? T.greenLight : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            <Ic n={done ? "check" : "task"} size={18} color={done ? T.green : T.blue} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{exam.title}</div>
            {exam.description && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{exam.description}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, paddingLeft: 46 }}>
          <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="history" size={13} color={T.muted} /> {exam.duration} мин
          </span>
          <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="task" size={13} color={T.muted} /> {exam.questions?.length ?? 0} асуулт
          </span>
          {!done && !isPremium && (
            <span style={{ fontSize: 12, color: "#D97706", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              🟡 {coinCost} зоос
            </span>
          )}
          {!done && isPremium && (
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✅ Үнэгүй</span>
          )}
        </div>
      </div>

      {done ? (
        <div style={{ background: T.greenLight, color: T.green, padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${T.green}30` }}>
          ✓ Өгсөн
        </div>
      ) : (
        <button onClick={onStart} style={{
          background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer",
          fontFamily: "Plus Jakarta Sans, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
          transition: "transform .15s",
          transform: hov ? "translateY(-1px)" : "none",
        }}>
          Эхлэх →
        </button>
      )}
    </div>
  );
}
