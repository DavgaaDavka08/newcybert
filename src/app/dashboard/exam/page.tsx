"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { useAppState } from "@/lib/app-state-context";
import { Loading } from "@/components/ui/Loading";
import { CoinIcon, CoinSpendModal } from "@/components/gamification";
import { SubpageShell } from "@/components/layout/SubpageShell";

const EXAM_FIRST_COST  = 0;  // Эхний оролдлого үнэгүй
const EXAM_RETAKE_COST = 2;  // Дахин өгөх = 2 зоос

interface Exam {
  _id: string; title: string; description?: string;
  duration: number; questions: { id: string }[];
  hasAttempt: boolean; createdAt: string;
}

export default function ExamListPage() {
  const { status } = useSession();
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

  useEffect(() => {
    if (!selectedExam) return;
    const isRetake = selectedExam.hasAttempt;
    const cost = appState.isPremium ? 0 : isRetake ? EXAM_RETAKE_COST : EXAM_FIRST_COST;
    if (cost === 0) {
      router.push(`/dashboard/exam/${selectedExam._id}`);
      setSelectedExam(null);
    }
  }, [selectedExam, appState.isPremium, router]);

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

  if (status === "loading" || loading) {
    return <Loading fullScreen background={T.bg} message="Ачаалж байна…" />;
  }

  return (
    <SubpageShell>
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>📋 Шалгалтууд</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {appState.isPremium && (
            <span style={{ background: "#FEF3C7", color: "#D97706", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              ⭐ Premium
            </span>
          )}
          <span style={{ fontSize: 13, color: T.muted, display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            <CoinIcon size="sm" glow />
            {appState.coins} зоос
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
              : `Шалгалт нэг бүр ${EXAM_RETAKE_COST} зоос зарцуулна. Хугацаатай асуултуудад хариулж, үр дүнгээ шууд харна уу.`}
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

      {selectedExam && (() => {
        const isRetake = selectedExam.hasAttempt;
        const cost = appState.isPremium ? 0 : isRetake ? EXAM_RETAKE_COST : EXAM_FIRST_COST;
        if (cost === 0) return null;
        return (
          <CoinSpendModal
            open
            onClose={() => { setSelectedExam(null); setErrMsg(""); }}
            coinCost={cost}
            balance={appState.coins}
            title={isRetake ? `${cost} зоос — дахин өгөх үү?` : `${cost} зоос ашиглах уу?`}
            lines={[
              isRetake
                ? `«${selectedExam.title}» шалгалтыг дахин өгөхөд ${cost} зоос зарцуулна.`
                : `Шалгалт эхлүүлэхэд ${cost} зоос зарцуулна.`,
              `Хугацаа: ${selectedExam.duration} мин · ${selectedExam.questions?.length ?? 0} асуулт`,
              ...(errMsg ? [errMsg] : []),
            ]}
            proLine="PRO авбал шалгалтын олон давталт хямд эсвэл үнэгүй."
            onConfirm={handleConfirmStart}
            confirmLoading={spending}
          />
        );
      })()}
    </div>
    </SubpageShell>
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
