// src/app/game/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";

interface Question {
  _id: string;
  question: string;
  options: string[];
}
interface AnswerResult {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  xpEarned: number;
  coinEarned: number;
}

function GameContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("cat") ?? "";
  const level = parseInt(searchParams.get("level") ?? "1");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [lives, setLives] = useState(session?.user?.lives ?? 5);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [finished, setFinished] = useState(false);
  const [animating, setAnimating] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/game/questions?categoryId=${categoryId}&level=${level}`,
    );
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions);
    }
    setLoading(false);
  }, [categoryId, level]);

  useEffect(() => {
    if (categoryId) loadQuestions();
  }, [categoryId, loadQuestions]);

  async function selectAnswer(idx: number) {
    if (selected !== null || animating) return;
    setSelected(idx);
    setAnimating(true);

    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: questions[currentIdx]._id,
        selectedIndex: idx,
      }),
    });
    const data: AnswerResult = await res.json();
    setResult(data);

    if (data.isCorrect) {
      setScore((s) => s + 1);
      setXp((x) => x + data.xpEarned);
      setCoins((c) => c + data.coinEarned);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 1500);
      }
    }
    setAnimating(false);
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelected(null);
    setResult(null);
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07070D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#E2E8F0" }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              animation: "float 1s ease-in-out infinite",
            }}
          >
            ⚡
          </div>
          <div style={{ color: "#64748B" }}>Асуултуудыг ачаалж байна...</div>
        </div>
      </div>
    );

  if (!categoryId)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07070D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
          <p>Сэдэв сонгоогүй байна. Дашбоард руу буц.</p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#FFD23F",
              color: "#07070D",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← Буцах
          </button>
        </div>
      </div>
    );

  // Game Over screen
  if (gameOver)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07070D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>💔</div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#EF4444",
              marginBottom: 8,
            }}
          >
            Амь дууслаа!
          </h2>
          <p style={{ color: "#64748B", marginBottom: 28 }}>
            Та {score} асуулт зөв хариуллаа
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#94A3B8",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ← Гарах
            </button>
            <button
              onClick={() => {
                setCurrentIdx(0);
                setSelected(null);
                setResult(null);
                setLives(5);
                setScore(0);
                setGameOver(false);
                loadQuestions();
              }}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "#FFD23F",
                color: "#07070D",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔄 Дахин тоглох
            </button>
          </div>
        </div>
      </div>
    );

  // Finished screen
  if (finished)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07070D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#FFD23F",
              marginBottom: 8,
            }}
          >
            Амжилт!
          </h2>
          <p style={{ color: "#64748B", marginBottom: 24 }}>
            Level {level} дууслаа!
          </p>

          <div
            style={{
              background: "#13131F",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: 24,
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            {[
              {
                icon: "✅",
                label: "Зөв",
                value: `${score}/${questions.length}`,
              },
              { icon: "⚡", label: "XP", value: `+${xp}` },
              { icon: "🪙", label: "Coin", value: `+${coins}` },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                <div
                  style={{ fontSize: 20, fontWeight: 900, color: "#FFD23F" }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "#FFD23F",
                color: "#07070D",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Дашбоард →
            </button>
          </div>
        </div>
      </div>
    );

  const question = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070D",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 20px 40px",
      }}
    >
      {/* Header bar */}
      <div style={{ width: "100%", maxWidth: 640, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ✕
          </button>

          {/* Progress bar */}
          <div
            style={{
              flex: 1,
              margin: "0 16px",
              height: 8,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                background: "linear-gradient(90deg, #FFD23F, #5ECEBA)",
                width: `${progress}%`,
                transition: "width 0.5s ease",
              }}
            />
          </div>

          {/* Lives */}
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                style={{ fontSize: 18, opacity: i < lives ? 1 : 0.2 }}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { icon: "⚡", label: `+${xp} XP` },
            { icon: "🪙", label: `+${coins}` },
            { icon: "📍", label: `${currentIdx + 1}/${questions.length}` },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                gap: 5,
                alignItems: "center",
                fontSize: 13,
                color: "#94A3B8",
              }}
            >
              {s.icon} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#13131F",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: 32,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Level {level} — Асуулт {currentIdx + 1}
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.5,
            color: "#E2E8F0",
          }}
        >
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {question.options.map((opt, i) => {
          let borderColor = "rgba(255,255,255,0.1)";
          let bgColor = "rgba(255,255,255,0.03)";
          let textColor = "#E2E8F0";

          if (selected !== null && result) {
            if (i === result.correctIndex) {
              borderColor = "#5ECEBA";
              bgColor = "rgba(94,206,186,0.1)";
              textColor = "#5ECEBA";
            } else if (i === selected && !result.isCorrect) {
              borderColor = "#EF4444";
              bgColor = "rgba(239,68,68,0.1)";
              textColor = "#FCA5A5";
            }
          } else if (selected === i) {
            borderColor = "#FFD23F";
            bgColor = "rgba(255,210,63,0.1)";
          }

          return (
            <button
              key={i}
              onClick={() => selectAnswer(i)}
              disabled={selected !== null}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: 14,
                cursor: selected !== null ? "default" : "pointer",
                border: `1.5px solid ${borderColor}`,
                background: bgColor,
                color: textColor,
                fontWeight: 700,
                fontSize: 15,
                textAlign: "left",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {["A", "B", "C", "D"][i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation + Next button */}
      {result && (
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            marginTop: 20,
            animation: "slideUp 0.3s ease",
          }}
        >
          <div
            style={{
              background: result.isCorrect
                ? "rgba(94,206,186,0.1)"
                : "rgba(239,68,68,0.08)",
              border: `1px solid ${result.isCorrect ? "rgba(94,206,186,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 16,
                marginBottom: 8,
                color: result.isCorrect ? "#5ECEBA" : "#EF4444",
              }}
            >
              {result.isCorrect ? "✅ Зөв!" : "❌ Буруу!"}
              {result.isCorrect && (
                <span style={{ color: "#FFD23F", marginLeft: 10 }}>
                  +{result.xpEarned} XP 🪙+{result.coinEarned}
                </span>
              )}
            </div>
            <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.7 }}>
              {result.explanation}
            </p>
          </div>

          <button
            onClick={nextQuestion}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              border: "none",
              background: "#FFD23F",
              color: "#07070D",
              fontWeight: 900,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {currentIdx + 1 >= questions.length
              ? "Дуусгах 🎉"
              : "Дараагийн асуулт →"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: "#07070D" }} />}
    >
      <GameContent />
    </Suspense>
  );
}
