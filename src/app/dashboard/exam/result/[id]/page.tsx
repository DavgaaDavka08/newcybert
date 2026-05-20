"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { BackButton } from "@/components/ui/BackButton";

interface AnswerResult {
  questionId: string; questionText: string; questionIndex: number;
  selectedOption: string | null; correctOption: string; isCorrect: boolean;
  options: { id: string; text: string }[];
}
interface Result {
  examTitle: string; score: number; total: number;
  correctCount: number; wrongCount: number; percentage: number;
  answers: AnswerResult[];
}

export default function ExamResultPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/exam/attempts/${id}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      Ачаалж байна...
    </div>
  );

  if (!result) return null;

  const pct = result.percentage;
  const grade = pct >= 90 ? { label: "Маш сайн!", color: "#16A34A", bg: "#ECFDF5" }
    : pct >= 75 ? { label: "Сайн!", color: "#4F46E5", bg: "#EEF2FF" }
    : pct >= 50 ? { label: "Дунд зэрэг", color: T.amber, bg: T.amberLight }
    : { label: "Дахин давтах хэрэгтэй", color: T.red, bg: T.redLight };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <BackButton href="/dashboard/exam" label="Шалгалтууд руу буцах" />
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Үр дүн</div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
        {/* Score card */}
        <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.shadowMd, marginBottom: 20 }}>
          <div style={{ background: `linear-gradient(135deg, ${grade.bg}, #fff)`, padding: "32px 28px", textAlign: "center", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: grade.color, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
              {pct}%
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: grade.color, marginBottom: 4 }}>{grade.label}</div>
            <div style={{ fontSize: 14, color: T.muted }}>{result.examTitle}</div>
          </div>

          {/* Score ring */}
          <div style={{ padding: "28px", display: "flex", justifyContent: "center" }}>
            <ScoreRing pct={pct} color={grade.color} />
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: `1px solid ${T.border}` }}>
            {[
              { label: "Зөв хариулт", val: result.correctCount, color: T.green, bg: T.greenLight },
              { label: "Нийт оноо",    val: `${result.score}/${result.total}`, color: "#4F46E5", bg: "#EEF2FF" },
              { label: "Алдсан",       val: result.wrongCount,  color: T.red, bg: T.redLight },
            ].map((s, i) => (
              <div key={i} style={{ padding: "16px", textAlign: "center", borderRight: i < 2 ? `1px solid ${T.border}` : "none", background: s.bg }}>
                <div style={{ fontWeight: 900, fontSize: 24, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle answers */}
        <button onClick={() => setShowAnswers(v => !v)} style={{
          width: "100%", padding: "14px", borderRadius: 12, border: `1.5px solid ${T.border}`,
          background: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", color: T.textSub,
          fontFamily: "inherit", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Ic n="task" size={16} color={T.muted} />
          {showAnswers ? "Хариултуудыг нуух" : "Хариултуудыг харах"}
          <Ic n={showAnswers ? "chevDown" : "chevRight"} size={14} color={T.muted} />
        </button>

        {/* Answer review */}
        {showAnswers && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {result.answers.map((a) => (
              <div key={a.questionId} style={{
                background: "#fff", borderRadius: 12, padding: "16px 18px",
                border: `1.5px solid ${a.isCorrect ? T.green + "60" : T.red + "60"}`,
                boxShadow: T.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, flex: 1 }}>
                    <span style={{ color: T.muted, fontSize: 11, fontWeight: 600, marginRight: 6 }}>{a.questionIndex}.</span>
                    {a.questionText}
                  </div>
                  <div style={{
                    flexShrink: 0, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: a.isCorrect ? T.greenLight : T.redLight,
                    color: a.isCorrect ? T.green : T.red,
                    border: `1px solid ${a.isCorrect ? T.green + "40" : T.red + "40"}`,
                  }}>
                    {a.isCorrect ? "✓ Зөв" : a.selectedOption ? "✗ Буруу" : "— Хариулаагүй"}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {a.options.map(opt => {
                    const isCorrect = opt.id === a.correctOption;
                    const isSelected = opt.id === a.selectedOption;
                    const bg = isCorrect ? T.greenLight : (isSelected && !isCorrect) ? T.redLight : "#FAFBFC";
                    const border = isCorrect ? T.green : (isSelected && !isCorrect) ? T.red : T.border;
                    const color = isCorrect ? T.green : (isSelected && !isCorrect) ? T.red : T.textSub;
                    return (
                      <div key={opt.id} style={{ padding: "8px 12px", borderRadius: 8, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color }}>
                        <span style={{ fontWeight: 800, minWidth: 20 }}>{opt.id}</span>
                        <span style={{ fontWeight: isCorrect || isSelected ? 700 : 400 }}>{opt.text}</span>
                        {isCorrect && <span style={{ marginLeft: "auto" }}>✓</span>}
                        {isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>✗</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/dashboard/exam")} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "#fff", fontWeight: 700, cursor: "pointer", color: T.textSub, fontFamily: "inherit", fontSize: 14 }}>
            ← Шалгалтуудруу
          </button>
          <button onClick={() => router.push("/dashboard")} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: 14, boxShadow: "0 4px 14px rgba(79,70,229,0.35)" }}>
            Дашбоард →
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 60, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={80} cy={80} r={r} fill="none" stroke={T.border} strokeWidth="10" />
        <circle cx={80} cy={80} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 32, color, letterSpacing: "-0.02em" }}>{pct}%</div>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Нийт оноо</div>
      </div>
    </div>
  );
}
