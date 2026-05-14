"use client";

import React, { useCallback, useMemo, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import {
  buildEesQuestions,
  EES_META,
  QUESTION_TAB_LABELS,
  REFERENCE_TEXT,
  type EesOption,
} from "@/lib/ees-data";
import { VoltmeterIllustration } from "./VoltmeterIllustration";

type Phase = "hub" | "quiz";

function MiniHeart({ filled }: { filled: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={filled ? T.red : "none"} stroke={filled ? T.red : T.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function MiniCopy() {
  return <Ic n="file" size={18} color={T.muted} />;
}

export function EesPracticeView() {
  const questions = useMemo(() => buildEesQuestions(), []);
  const [phase, setPhase] = useState<Phase>("hub");
  const [hubTab, setHubTab] = useState(0);
  const [refOpen, setRefOpen] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());
  const [answers, setAnswers] = useState<Record<number, EesOption["id"]>>({});
  const [solutionOpenFor, setSolutionOpenFor] = useState<number | null>(null);
  const [mockCoins, setMockCoins] = useState(5);
  const [toast, setToast] = useState<string | null>(null);

  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const previewQ = questions[Math.min(hubTab, questions.length - 1)];
  const current = questions[qIndex];

  const toggleFav = (idx: number) => {
    setFavorites((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  const startQuiz = () => {
    setQIndex(Math.min(hubTab, questions.length - 1));
    setPhase("quiz");
  };

  const buySolution = () => {
    if (solutionOpenFor === qIndex) {
      setSolutionOpenFor(null);
      return;
    }
    if (mockCoins < 1) {
      pushToast("Зоос хүрэлцэхгүй байна (жишээ дэмо).");
      return;
    }
    setMockCoins((c) => c - 1);
    setSolutionOpenFor(qIndex);
  };

  const selectAnswer = (id: EesOption["id"]) => {
    setAnswers((a) => ({ ...a, [qIndex]: id }));
  };

  const gridBg = {
    backgroundColor: T.bg,
    backgroundImage: "radial-gradient(circle, #CBD5E1 0.45px, transparent 0.45px)",
    backgroundSize: "18px 18px",
  } as const;

  return (
    <div style={{ ...gridBg, minHeight: "100%", paddingBottom: 40, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            padding: "10px 18px",
            borderRadius: 12,
            background: "#1e293b",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: T.shadowLg,
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 18px 0" }}>
        {/* Title */}
        <h1 style={{ margin: "8px 0 14px", textAlign: "center", fontSize: 22, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
          {EES_META.title}
        </h1>

        {/* Question pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 4,
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {QUESTION_TAB_LABELS.map((label, i) => {
              const active = phase === "hub" ? i === hubTab : i === qIndex;
              return (
                <button
                  key={`${label}-${i}`}
                  type="button"
                  onClick={() => {
                    if (phase === "hub") setHubTab(i);
                    else setQIndex(i);
                  }}
                  style={{
                    flexShrink: 0,
                    minWidth: 36,
                    height: 36,
                    borderRadius: 10,
                    border: active ? `2px solid ${T.purple}` : `1px solid ${T.border}`,
                    background: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    color: active ? T.purple : T.textSub,
                    cursor: "pointer",
                    boxShadow: active ? `0 2px 10px ${T.purple}33` : T.shadow,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            title="Шинэчлэх"
            onClick={() => {
              setAnswers({});
              setSolutionOpenFor(null);
              pushToast("Сонголтууд цэвэрлэгдлээ.");
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `1px solid ${T.border}`,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: T.shadow,
            }}
          >
            <Ic n="refresh" size={18} color={T.textSub} />
          </button>
        </div>

        {/* Start bar */}
        <button
          type="button"
          onClick={phase === "hub" ? startQuiz : () => setPhase("hub")}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 16,
            padding: "14px 18px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "linear-gradient(90deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 6px 22px rgba(37,99,235,0.35)",
            fontFamily: "inherit",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 15 }}>
            <Ic n="exam" size={22} color="#fff" />
            {phase === "hub" ? "СОРИЛ ӨГӨХ" : "ҮЗЭЖ БАЙНА — БУЦАХ"}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.22)",
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {EES_META.durationMin} минут
            <Ic n="chevRight" size={16} color="#fff" />
          </span>
        </button>

        {/* Reference */}
        <div
          style={{
            borderRadius: 14,
            border: `2px solid #fdba74`,
            background: "#fff7ed",
            marginBottom: 16,
            overflow: "hidden",
            boxShadow: T.shadow,
          }}
        >
          <button
            type="button"
            onClick={() => setRefOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#ea580c", marginBottom: 2 }}>REFERENCE</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#c2410c" }}>ЛАВЛАХ МАТЕРИАЛ</div>
            </div>
            <Ic n={refOpen ? "arrowUp" : "chevDown"} size={20} color="#ea580c" />
          </button>
          {refOpen && (
            <div style={{ padding: "0 14px 14px", fontSize: 13, color: "#9a3412", lineHeight: 1.55 }}>{REFERENCE_TEXT}</div>
          )}
        </div>

        {phase === "hub" ? (
          <QuestionCard
            q={previewQ}
            qIndex={Math.min(hubTab, questions.length - 1)}
            selected={answers[Math.min(hubTab, questions.length - 1)]}
            onSelect={() => {}}
            readOnly
            favorites={favorites}
            onToggleFav={() => toggleFav(Math.min(hubTab, questions.length - 1))}
            solutionOpen={solutionOpenFor === Math.min(hubTab, questions.length - 1)}
            solutionText=""
            showSolutionUi={false}
          />
        ) : (
          <>
            <QuestionCard
              q={current}
              qIndex={qIndex}
              selected={answers[qIndex]}
              onSelect={selectAnswer}
              favorites={favorites}
              onToggleFav={() => toggleFav(qIndex)}
              solutionOpen={solutionOpenFor === qIndex}
              solutionText={current.solution}
              showSolutionUi
            />

            <div
              style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <button
                type="button"
                disabled={qIndex <= 0}
                onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  color: qIndex <= 0 ? T.muted : T.text,
                  cursor: qIndex <= 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <Ic n="chevLeft" size={16} color={qIndex <= 0 ? T.muted : T.text} />
                ӨМНӨХ
              </button>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: "#f1f5f9",
                  fontWeight: 800,
                  fontSize: 13,
                  color: T.textSub,
                  border: `1px solid ${T.border}`,
                }}
              >
                {qIndex + 1}/{questions.length}
              </div>
              <button
                type="button"
                disabled={qIndex >= questions.length - 1}
                onClick={() => setQIndex((i) => Math.min(questions.length - 1, i + 1))}
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  borderRadius: 12,
                  border: `2px solid ${T.purple}`,
                  background: "#faf5ff",
                  fontWeight: 800,
                  fontSize: 13,
                  color: T.purple,
                  cursor: qIndex >= questions.length - 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "inherit",
                  opacity: qIndex >= questions.length - 1 ? 0.45 : 1,
                }}
              >
                ДАРААГИЙНХ
                <Ic n="chevRight" size={16} color={T.purple} />
              </button>
            </div>

            <div style={{ marginTop: 22, position: "relative" }}>
              <button
                type="button"
                onClick={buySolution}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 14,
                  padding: "15px 18px",
                  background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 17 }}>✨</span>
                {solutionOpenFor === qIndex ? "БОДОЛТ ХААХ" : "БОДОЛТ ХИЙЛГЭХ"}
              </button>
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 12,
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  color: "#422006",
                  fontWeight: 900,
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: T.shadowMd,
                }}
              >
                <Ic n="coin" size={13} color="#92400e" />
                1ш
              </div>
              <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: T.muted }}>
                1 зоос ашиглан бодолт авах · үлдсэн:{" "}
                <strong style={{ color: T.text }}>{mockCoins}</strong>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  qIndex,
  selected,
  onSelect,
  readOnly,
  favorites,
  onToggleFav,
  solutionOpen,
  solutionText,
  showSolutionUi,
}: {
  q: ReturnType<typeof buildEesQuestions>[number];
  qIndex: number;
  selected?: EesOption["id"];
  onSelect: (id: EesOption["id"]) => void;
  readOnly?: boolean;
  favorites: Set<number>;
  onToggleFav: () => void;
  solutionOpen: boolean;
  solutionText: string;
  showSolutionUi: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: "18px 16px 16px",
        boxShadow: T.shadowMd,
        border: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 4 }}>ДУГААР {q.displayNum}</div>
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              color: "#0284c7",
              background: "#e0f2fe",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {q.topic}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }} aria-label="Хуулах">
            <MiniCopy />
          </button>
          <button type="button" style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }} onClick={onToggleFav} aria-label="Дуртай">
            <MiniHeart filled={favorites.has(qIndex)} />
          </button>
        </div>
      </div>

      <p style={{ margin: "12px 0 14px", fontSize: 15, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>{q.text}</p>

      {q.illustration === "voltmeter" && (
        <div style={{ marginBottom: 16, padding: "10px 8px", background: "#f8fafc", borderRadius: 14, border: `1px solid ${T.border}` }}>
          <VoltmeterIllustration />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt) => {
          const isSel = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={readOnly}
              onClick={() => onSelect(opt.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 14,
                border: `2px solid ${isSel ? T.blue : T.border}`,
                background: isSel ? T.blueLight : "#fafafa",
                cursor: readOnly ? "default" : "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "border-color .15s, background .15s",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `2px solid ${isSel ? T.blue : T.borderMd}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 900,
                  color: isSel ? T.blue : T.muted,
                  background: "#fff",
                }}
              >
                {opt.id}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {showSolutionUi && solutionOpen && solutionText && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: T.greenLight,
            border: `1px solid ${T.green}44`,
            fontSize: 13,
            color: "#166534",
            lineHeight: 1.55,
          }}
        >
          <strong>Бодолт:</strong> {solutionText}
        </div>
      )}
    </div>
  );
}
