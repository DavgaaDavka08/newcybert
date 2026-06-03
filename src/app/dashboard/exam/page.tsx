"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { BackButton } from "@/components/ui/BackButton";
import { useAppState } from "@/lib/app-state-context";

const EXAM_FIRST_COST  = 0;  // Эхний оролдлого үнэгүй
const EXAM_RETAKE_COST = 2;  // Дахин өгөх = 2 зоос

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

    const isRetake  = selectedExam.hasAttempt;
    const coinCost  = appState.isPremium ? 0 : isRetake ? EXAM_RETAKE_COST : EXAM_FIRST_COST;
    const action    = isRetake ? "exam_retake" : "exam_start";

    if (coinCost === 0) {
      router.push(`/dashboard/exam/${selectedExam._id}`);
      return;
    }

    setSpending(true);
    try {
      const res = await fetch("/api/user/spend-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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
                onStart={() => { setSelectedExam(exam); setErrMsg(""); }}
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

            {(() => {
              const isRetake = selectedExam.hasAttempt;
              const cost = appState.isPremium ? 0 : isRetake ? EXAM_RETAKE_COST : EXAM_FIRST_COST;
              return (
                <>
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{isRetake ? "🔄" : "📝"}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
                      {isRetake ? "Дахин өгөх үү?" : "Сорил эхлүүлэх үү?"}
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
                      {appState.isPremium
                        ? "⭐ Premium — үнэгүй"
                        : isRetake
                          ? <><strong style={{ color: "#fff" }}>{EXAM_RETAKE_COST} зоос</strong> зарцуулна</>
                          : "Эхний оролдлого <strong>үнэгүй!</strong>"
                      }
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    <InfoRow icon={cost === 0 ? "✅" : "🟡"} label={`Үнэ: ${cost === 0 ? (appState.isPremium ? "Үнэгүй (Premium)" : "Үнэгүй") : `${cost} зоос`}`} />
                    <InfoRow icon="⏱️" label={`Хугацаа: ${selectedExam.duration} мин`} />
                    <InfoRow icon="📝" label={`Асуулт: ${selectedExam.questions?.length ?? 0}`} />
                    {cost > 0 && <InfoRow icon="💛" label={`Үлдэгдэл: ${appState.coins - cost} зоос`} warn={appState.coins < cost} />}
                  </div>
                </>
              );
            })()}

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
              {(() => {
                const isRetake = selectedExam.hasAttempt;
                const cost = appState.isPremium ? 0 : isRetake ? EXAM_RETAKE_COST : EXAM_FIRST_COST;
                const canAfford = cost === 0 || appState.coins >= cost;
                if (!canAfford) return (
                  <button onClick={() => router.push("/dashboard/premium")}
                    style={{ flex: 1.5, padding: "12px 0", borderRadius: 12, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    🟡 Зоос авах
                  </button>
                );
                return (
                  <button onClick={handleConfirmStart} disabled={spending}
                    style={{ flex: 1.5, padding: "12px 0", borderRadius: 12, border: "none", background: spending ? "#555" : "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: spending ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                    {spending ? "..." : cost === 0 ? "✅ Эхлэх" : `🟡 ${cost} зоос зарцуулах`}
                  </button>
                );
              })()}
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

function ExamCard({ exam, isPremium, onStart }: { exam: Exam; isPremium: boolean; onStart: () => void }) {
  const [hov, setHov] = useState(false);
  const done = exam.hasAttempt;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: "#fff", borderRadius: 14,
      border: `1.5px solid ${hov ? "#4F46E5" : done ? "#86EFAC" : T.border}`,
      padding: "20px 22px",
      boxShadow: hov ? "0 4px 20px rgba(79,70,229,0.12)" : T.shadow,
      transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: done ? T.greenLight : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic n={done ? "check" : "task"} size={18} color={done ? T.green : T.blue} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{exam.title}</div>
            {exam.description && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{exam.description}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, paddingLeft: 46, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="history" size={13} color={T.muted} /> {exam.duration} мин
          </span>
          <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="task" size={13} color={T.muted} /> {exam.questions?.length ?? 0} асуулт
          </span>
          {isPremium
            ? <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>⭐ Үнэгүй</span>
            : done
              ? <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>🔄 Дахин: {EXAM_RETAKE_COST}🟡</span>
              : <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✅ Эхний: үнэгүй</span>
          }
        </div>
      </div>

      <button onClick={onStart} style={{
        background: done ? "#F59E0B" : "#4F46E5", color: "#fff", border: "none", borderRadius: 10,
        padding: "10px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        boxShadow: done ? "0 4px 14px rgba(245,158,11,0.35)" : "0 4px 14px rgba(79,70,229,0.35)",
        transition: "transform .15s", transform: hov ? "translateY(-1px)" : "none",
        whiteSpace: "nowrap",
      }}>
        {done ? "🔄 Дахин" : "Эхлэх →"}
      </button>
    </div>
  );
}
