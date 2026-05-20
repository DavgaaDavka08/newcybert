"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useAppState } from "@/lib/app-state-context";
import React, { useEffect, useRef, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { BackButton } from "@/components/ui/BackButton";
import { useToast } from "@/components/ui/Toast";

interface Option { id: string; text: string; }
interface Question { id: string; question: string; options: Option[]; }
interface Exam { _id: string; title: string; duration: number; questions: Question[]; }

export default function TakeExamPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reward, setReward] = useState<{ xpEarned: number; coinsEarned: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { refreshStats } = useAppState();
  const toast = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function load() {
      try {
        // Get exam
        const eRes = await fetch(`/api/exam/exams/${examId}`);
        if (!eRes.ok) throw new Error("Шалгалт олдсонгүй");
        const eData = await eRes.json();
        setExam(eData);
        setTimeLeft(eData.duration * 60);

        // Start attempt
        const aRes = await fetch("/api/exam/attempts/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId }),
        });
        const aData = await aRes.json();

        if (!aRes.ok) {
          if (aData.message?.includes("аль хэдийн")) {
            const msg = "Та энэ шалгалтыг аль хэдийн өгсөн байна!";
            setError(msg);
            toast.warning(msg, "Шалгалт");
            setTimeout(() => router.push("/dashboard/exam"), 2200);
            return;
          }
          throw new Error(aData.error ?? "Attempt эхлүүлэхэд алдаа");
        }
        setAttemptId(aData._id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, examId, router]);

  // Countdown
  useEffect(() => {
    if (!exam || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setShowTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [exam]);

  async function saveAnswer(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    try {
      await fetch("/api/exam/attempts/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId, selectedOption: optionId }),
      });
    } catch {}
  }

  async function submitExam() {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    try {
      const res = await fetch("/api/exam/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (res.ok) {
        setReward({ xpEarned: data.xpEarned ?? 0, coinsEarned: data.coinsEarned ?? 0 });
        await refreshStats();
        setTimeout(() => router.push(`/dashboard/exam/result/${data.attemptId ?? attemptId}`), 1800);
      } else {
        toast.error(data.error ?? "Алдаа гарлаа", "Шалгалт");
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  }

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const urgent = timeLeft < 300 && timeLeft > 0;
  const answered = Object.keys(answers).length;

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
        Шалгалт ачаалж байна...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: T.red, marginBottom: 8 }}>{error}</div>
        <BackButton href="/dashboard/exam" label="Буцах" />
      </div>
    </div>
  );

  if (!exam) return null;
  const q = exam.questions[currentQ];

  const navBtnStyle = (isCurrent: boolean, isAnswered: boolean): React.CSSProperties => ({
    height: 36, width: "100%", borderRadius: 8,
    border: `2px solid ${isCurrent ? "#4F46E5" : isAnswered ? T.green : T.border}`,
    background: isCurrent ? "#4F46E5" : isAnswered ? T.greenLight : "#fff",
    color: isCurrent ? "#fff" : isAnswered ? T.green : T.textSub,
    fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.1s",
  });

  const pillStyle = (isCurrent: boolean, isAnswered: boolean): React.CSSProperties => ({
    borderColor: isCurrent ? "#4F46E5" : isAnswered ? T.green : "#e2e8f0",
    background: isCurrent ? "#4F46E5" : isAnswered ? T.greenLight : "#fff",
    color: isCurrent ? "#fff" : isAnswered ? T.green : T.textSub,
  });

  return (
    <div className="exam-page">
      <header className="exam-header">
        <BackButton href="/dashboard/exam" label="Буцах" />
        <div className="exam-header-main">
          <div className="exam-header-title">{exam.title}</div>
          <div className="exam-header-sub">{answered}/{exam.questions.length} асуулт хариулсан</div>
        </div>
        <div className={`exam-timer ${urgent ? "exam-timer--urgent" : "exam-timer--ok"}`}>
          <Ic n="history" size={20} color={urgent ? T.red : "#4F46E5"} />
          {fmt(timeLeft)}
        </div>
      </header>

      <div className="exam-body">
        <div className="exam-nav-pills" role="tablist" aria-label="Асуултууд">
          {exam.questions.map((item, idx) => {
            const isCurrent = currentQ === idx;
            const isAnswered = !!answers[item.id];
            return (
              <button key={item.id} type="button" className="exam-nav-pill" style={pillStyle(isCurrent, isAnswered)} onClick={() => setCurrentQ(idx)} aria-current={isCurrent ? "step" : undefined}>
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="exam-layout">
          <aside className="exam-sidebar">
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 14 }}>Асуултууд</div>
            <div className="exam-nav-grid">
              {exam.questions.map((item, idx) => {
                const isCurrent = currentQ === idx;
                const isAnswered = !!answers[item.id];
                return (
                  <button key={item.id} type="button" onClick={() => setCurrentQ(idx)} style={navBtnStyle(isCurrent, isAnswered)}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: T.textSub }}>Хариулсан:</span>
                <span style={{ fontWeight: 700, color: T.green }}>{answered}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.textSub }}>Үлдсэн:</span>
                <span style={{ fontWeight: 700, color: T.muted }}>{exam.questions.length - answered}</span>
              </div>
            </div>
          </aside>

          <div>
            <div className="exam-card">
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#4F46E5", background: "#EEF2FF", padding: "3px 10px", borderRadius: 99, border: "1px solid #C7D2FE", marginBottom: 18 }}>
                Асуулт {currentQ + 1}/{exam.questions.length}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1.6, marginBottom: 28, wordBreak: "break-word" }}>
                {q.question}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.id;
                  return (
                    <button key={opt.id} type="button" onClick={() => saveAnswer(q.id, opt.id)} style={{
                      padding: "14px 18px", borderRadius: 12,
                      border: `2px solid ${selected ? "#4F46E5" : T.border}`,
                      background: selected ? "#EEF2FF" : "#fff",
                      textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                      fontFamily: "inherit", transition: "all 0.12s", width: "100%",
                      boxShadow: selected ? "0 0 0 3px rgba(79,70,229,0.12)" : "none",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: selected ? "#4F46E5" : T.border,
                        color: selected ? "#fff" : T.textSub,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 13,
                      }}>{opt.id}</div>
                      <span style={{ fontSize: 15, fontWeight: selected ? 700 : 500, color: selected ? "#3730A3" : T.text, wordBreak: "break-word" }}>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="exam-actions">
              <button type="button" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} style={{
                padding: "11px 22px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "#fff",
                fontWeight: 700, fontSize: 14, cursor: currentQ === 0 ? "not-allowed" : "pointer",
                color: currentQ === 0 ? T.muted : T.textSub, fontFamily: "inherit", width: "100%", maxWidth: 200,
              }}>← Өмнөх</button>
              {currentQ < exam.questions.length - 1 ? (
                <button type="button" onClick={() => setCurrentQ(currentQ + 1)} style={{
                  padding: "11px 28px", borderRadius: 10, border: "none", background: "#4F46E5",
                  fontWeight: 800, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.35)", flex: 1, maxWidth: 280,
                }}>Дараах →</button>
              ) : (
                <button type="button" onClick={() => setShowConfirm(true)} style={{
                  padding: "11px 28px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #16A34A, #15803D)",
                  fontWeight: 800, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(22,163,74,0.35)", flex: 1, maxWidth: 280,
                }}>✅ Дуусгах</button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Submit confirm dialog */}
      {showConfirm && (
        <DialogOverlay onClose={() => setShowConfirm(false)}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>Шалгалтыг дуусгах уу?</div>
          <div style={{ color: T.textSub, marginBottom: 6 }}>
            Та <b>{answered}</b>/{exam.questions.length} асуултад хариулсан байна.
          </div>
          {answered < exam.questions.length && (
            <div style={{ color: T.red, fontSize: 13, marginBottom: 16 }}>
              ⚠️ Хариулаагүй {exam.questions.length - answered} асуулт автоматаар буруу тооцогдоно.
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Үргэлжлүүлэх
            </button>
            <button onClick={() => { setShowConfirm(false); submitExam(); }} disabled={submitting} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              {submitting ? "Илгээж байна..." : "Дуусгах"}
            </button>
          </div>
        </DialogOverlay>
      )}

      {/* Time up dialog */}
      {showTimeUp && (
        <DialogOverlay onClose={() => {}}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Хугацаа дууслаа!</div>
          <div style={{ color: T.textSub, marginBottom: 20 }}>Хугацаа дуусав. Шалгалт автоматаар илгээгдэж байна...</div>
          <button onClick={submitExam} disabled={submitting} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            {submitting ? "Илгээж байна..." : "Үр дүн харах →"}
          </button>
        </DialogOverlay>
      )}

      {/* XP reward overlay */}
      {reward && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 20, padding: "28px 36px", textAlign: "center", boxShadow: "0 20px 60px rgba(79,70,229,0.5)", animation: "rewardPop 0.4s cubic-bezier(.34,1.56,.64,1)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 4 }}>Шалгалт дуусгалаа!</div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 28, color: "#FFD23F" }}>+{reward.xpEarned}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>XP</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 28, color: "#FCD34D" }}>+{reward.coinsEarned}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>Коин</div>
              </div>
            </div>
          </div>
          <style>{`@keyframes rewardPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        {children}
      </div>
    </div>
  );
}
