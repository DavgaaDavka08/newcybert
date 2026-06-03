"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CoinIcon, CoinSpendModal } from "@/components/gamification";
import {
  buildEesQuestions,
  EES_META,
  getQuestionTabLabels,
  REFERENCE_TEXT,
  type EesOption,
  type EesQuestion,
} from "@/lib/ees-data";
import { ExamFigure } from "./ExamFigure";
import {
  clearEesState,
  formatTimer,
  loadEesState,
  saveEesState,
} from "@/lib/ees-storage";

type Phase = "hub" | "quiz" | "finished";

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
  const { confirm } = useConfirm();
  const { data: session, update: updateSession } = useSession();
  const questions = useMemo(() => buildEesQuestions(), []);
  const tabLabels = useMemo(() => getQuestionTabLabels(questions), [questions]);
  const choiceQuestions = useMemo(() => questions.filter((q) => q.type === "choice"), [questions]);
  const eesRewardSent = useRef(false);
  const [eesReward, setEesReward] = useState<{ xp: number; coins: number } | null>(null);

  const [phase, setPhase] = useState<Phase>("hub");
  const [hubTab, setHubTab] = useState(0);
  const [refOpen, setRefOpen] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());
  const [answers, setAnswers] = useState<Record<number, EesOption["id"]>>({});
  const [solutionsUnlocked, setSolutionsUnlocked] = useState<Set<number>>(() => new Set());
  const [solutionOpenFor, setSolutionOpenFor] = useState<number | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [coinModalOpen, setCoinModalOpen] = useState(false);
  const [coinModalBusy, setCoinModalBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EES_META.durationMin * 60);
  const [hydrated, setHydrated] = useState(false);

  const pillsRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pushToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  // Load saved progress + user coins
  useEffect(() => {
    const saved = loadEesState();
    if (saved) {
      setAnswers(saved.answers ?? {});
      setFavorites(new Set(saved.favorites ?? []));
      setHubTab(saved.hubTab ?? 0);
      setSolutionsUnlocked(new Set(saved.solutionsUnlocked ?? []));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveEesState({
      answers,
      favorites: [...favorites],
      hubTab,
      solutionsUnlocked: [...solutionsUnlocked],
    });
  }, [answers, favorites, hubTab, solutionsUnlocked, hydrated]);

  useEffect(() => {
    const fromSession = session?.user?.coins;
    if (typeof fromSession === "number") {
      setCoins(fromSession);
      return;
    }
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.coins === "number") setCoins(d.coins);
      })
      .catch(() => setCoins(0));
  }, [session?.user?.coins]);

  // Quiz timer
  useEffect(() => {
    if (phase !== "quiz" || timeLeft <= 0) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setPhase("finished");
          pushToast("Цаг дууслаа. Үр дүнг харна уу.");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, timeLeft, pushToast]);

  // Scroll active pill into view
  useEffect(() => {
    const idx = phase === "hub" ? hubTab : qIndex;
    pillRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [hubTab, qIndex, phase]);

  const activeIndex = phase === "hub" ? hubTab : qIndex;
  const previewQ = questions[Math.min(activeIndex, questions.length - 1)];
  const current = questions[qIndex];
  const answeredCount = Object.keys(answers).length;

  const score = useMemo(() => {
    let correct = 0;
    let points = 0;
    let maxPoints = 0;
    questions.forEach((q, i) => {
      if (q.type !== "choice") return;
      maxPoints += q.points;
      if (answers[i] === q.correctId) {
        correct += 1;
        points += q.points;
      }
    });
    return { correct, points, total: choiceQuestions.length, maxPoints };
  }, [answers, questions, choiceQuestions.length]);

  const toggleFav = (idx: number) => {
    setFavorites((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  const goToQuestion = (i: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, i));
    if (phase === "hub") setHubTab(clamped);
    else setQIndex(clamped);
    setSolutionOpenFor(solutionsUnlocked.has(clamped) ? clamped : null);
  };

  const startQuiz = () => {
    eesRewardSent.current = false;
    setEesReward(null);
    setQIndex(Math.min(hubTab, questions.length - 1));
    setTimeLeft(EES_META.durationMin * 60);
    setPhase("quiz");
    pushToast("Сорил эхэллээ. Амжилт хүсье!");
  };

  const resetProgress = async () => {
    const ok = await confirm({
      title: "Явц цэвэрлэх",
      description: "Бүх хариулт, дуртай болон явцыг цэвэрлэх үү?",
      confirmLabel: "Цэвэрлэх",
      destructive: true,
    });
    if (!ok) return;
    setAnswers({});
    setFavorites(new Set());
    setSolutionsUnlocked(new Set());
    setSolutionOpenFor(null);
    setHubTab(0);
    setQIndex(0);
    setPhase("hub");
    setTimeLeft(EES_META.durationMin * 60);
    clearEesState();
    pushToast("Сонголтууд цэвэрлэгдлээ.");
  };

  const finishQuiz = () => {
    setPhase("finished");
  };

  const eesPercent = useMemo(() => {
    if (score.maxPoints > 0) {
      return Math.round((score.points / score.maxPoints) * 100);
    }
    if (score.total > 0) {
      return Math.round((score.correct / score.total) * 100);
    }
    return 0;
  }, [score]);

  useEffect(() => {
    if (phase !== "finished" || eesRewardSent.current) return;
    eesRewardSent.current = true;
    fetch("/api/ees/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: eesPercent }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || d.alreadyRewarded) return;
        setEesReward({ xp: d.xpEarned ?? 0, coins: d.coinsEarned ?? 0 });
        if (typeof d.coins === "number") setCoins(d.coins);
        void updateSession?.({ xp: d.xp, coins: d.coins, level: d.level });
      })
      .catch(() => {});
  }, [phase, eesPercent, updateSession]);

  const requestSolution = () => {
    if (solutionOpenFor === qIndex) {
      setSolutionOpenFor(null);
      return;
    }
    if (solutionsUnlocked.has(qIndex)) {
      setSolutionOpenFor(qIndex);
      return;
    }
    setCoinModalOpen(true);
  };

  const confirmBuySolution = async () => {
    const balance = coins ?? session?.user?.coins ?? 0;
    if (balance < 1) {
      pushToast("Зоос хүрэлцэхгүй байна.");
      return;
    }
    setCoinModalBusy(true);
    try {
      const r = await fetch("/api/user/spend-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hint" }),
      });
      const d = await r.json();
      if (!r.ok) {
        pushToast(d.error ?? "Зоос хасахад алдаа гарлаа");
        return;
      }
      setCoins(d.coins);
      await updateSession?.({ coins: d.coins });
      setSolutionsUnlocked((prev) => new Set([...prev, qIndex]));
      setSolutionOpenFor(qIndex);
      setCoinModalOpen(false);
    } catch {
      pushToast("Сүлжээний алдаа");
    } finally {
      setCoinModalBusy(false);
    }
  };

  const selectAnswer = (id: EesOption["id"]) => {
    const q = questions[activeIndex];
    if (q?.type !== "choice") return;
    setAnswers((a) => ({ ...a, [activeIndex]: id }));
  };

  const copyQuestion = async (q: typeof previewQ) => {
    const text = `${q.displayNum}. ${q.text}\n${q.options.map((o) => `${o.id}. ${o.text}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Асуулт хуулагдлаа");
    } catch {
      pushToast("Хуулах боломжгүй");
    }
  };

  const gridBg = {
    backgroundColor: T.bg,
    backgroundImage: "radial-gradient(circle, #CBD5E1 0.45px, transparent 0.45px)",
    backgroundSize: "18px 18px",
  } as const;

  if (!hydrated) {
    return (
      <div style={{ ...gridBg, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loading size={80} message="Ачаалж байна…" />
      </div>
    );
  }

  return (
    <div style={{ ...gridBg, minHeight: "calc(100vh - 56px)", paddingBottom: 48, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
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
        <h1 style={{ margin: "8px 0 6px", textAlign: "center", fontSize: 22, fontWeight: 900, color: "#1e3a8a", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
          {EES_META.title}
        </h1>
        <p style={{ textAlign: "center", fontSize: 13, color: T.muted, marginBottom: 14 }}>
          {EES_META.subtitle} · Нэгдүгээр хэсэг {EES_META.totalQuestions} · Хоёрдугаар хэсэг {EES_META.part2Count}
        </p>

        {/* Question pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div
            ref={pillsRef}
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
            {tabLabels.map((label, i) => {
              const active = i === activeIndex;
              const answered = questions[i]?.type === "choice" && answers[i] != null;
              const fav = favorites.has(i);
              return (
                <button
                  key={`${label}-${i}`}
                  ref={(el) => { pillRefs.current[i] = el; }}
                  type="button"
                  onClick={() => goToQuestion(i)}
                  style={{
                    flexShrink: 0,
                    minWidth: 36,
                    height: 36,
                    borderRadius: 10,
                    border: active ? `2px solid ${T.purple}` : answered ? `2px solid ${T.green}` : `1px solid ${T.border}`,
                    background: active ? "#faf5ff" : answered ? "#f0fdf4" : "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    color: active ? T.purple : answered ? T.green : T.textSub,
                    cursor: "pointer",
                    boxShadow: active ? `0 2px 10px ${T.purple}33` : T.shadow,
                    position: "relative",
                  }}
                >
                  {label}
                  {fav && (
                    <span style={{ position: "absolute", top: 2, right: 3, fontSize: 8, color: T.red }}>♥</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            title="Дахин эхлэх"
            onClick={resetProgress}
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

        {/* Start / timer bar */}
        <button
          type="button"
          onClick={() => {
            if (phase === "hub") startQuiz();
            else if (phase === "quiz") setPhase("hub");
            else {
              setPhase("hub");
              setTimeLeft(EES_META.durationMin * 60);
            }
          }}
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
            {phase === "hub" ? "СОРИЛ ӨГӨХ" : phase === "quiz" ? "ҮЗЭЖ БАЙНА — БУЦАХ" : "ДАХИН ЭХЛЭХ"}
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
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {phase === "quiz" ? formatTimer(timeLeft) : `${EES_META.durationMin} минут`}
            <Ic n="chevRight" size={16} color="#fff" />
          </span>
        </button>

        {phase === "quiz" && (
          <div style={{ marginBottom: 12, fontSize: 12, color: T.muted, textAlign: "center" }}>
            Хариулсан: <strong style={{ color: T.text }}>{answeredCount}</strong> / {questions.length}
            {coins != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
                <CoinIcon size="xs" />
                <strong style={{ color: T.text }}>{coins}</strong>
              </span>
            )}
          </div>
        )}

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

        {phase === "finished" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              textAlign: "center",
              boxShadow: T.shadowMd,
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Сорил дууслаа</h2>
            <p style={{ fontSize: 14, color: T.muted, marginBottom: 8 }}>
              Нэгдүгээр хэсэг: <strong style={{ color: T.green }}>{score.correct}</strong> / {score.total} зөв
              {" · "}
              Оноо: <strong style={{ color: T.blue }}>{score.points}</strong> / {score.maxPoints}
              {" · "}
              {eesPercent}%
            </p>
            {eesReward && (eesReward.xp > 0 || eesReward.coins > 0) && (
              <p style={{ fontSize: 14, fontWeight: 800, color: T.purple, marginBottom: 16 }}>
                +{eesReward.xp} XP · +{eesReward.coins} зоос
              </p>
            )}
            {!eesReward && <div style={{ marginBottom: 16 }} />}
            <button
              type="button"
              onClick={() => {
                setPhase("hub");
                setTimeLeft(EES_META.durationMin * 60);
              }}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: T.blue,
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Буцах
            </button>
          </div>
        ) : (
          <>
            <QuestionCard
              q={phase === "hub" ? previewQ : current}
              qIndex={activeIndex}
              selected={answers[activeIndex]}
              onSelect={selectAnswer}
              readOnly={false}
              showFeedback={phase === "quiz"}
              correctId={phase === "quiz" && questions[activeIndex]?.type === "choice" ? questions[activeIndex].correctId : undefined}
              favorites={favorites}
              onToggleFav={() => toggleFav(activeIndex)}
              onCopy={() => copyQuestion(phase === "hub" ? previewQ : current)}
              solutionOpen={solutionOpenFor === activeIndex}
              solutionText={(phase === "hub" ? previewQ : current).solution}
              showSolutionUi={phase === "quiz" && solutionsUnlocked.has(activeIndex)}
            />

            {phase === "quiz" && current?.type === "choice" && (
              <>
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
                    onClick={() => goToQuestion(qIndex - 1)}
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
                  {qIndex >= questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={finishQuiz}
                      style={{
                        flex: 1,
                        padding: "12px 10px",
                        borderRadius: 12,
                        border: "none",
                        background: T.green,
                        fontWeight: 800,
                        fontSize: 13,
                        color: "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ДУУСГАХ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goToQuestion(qIndex + 1)}
                      style={{
                        flex: 1,
                        padding: "12px 10px",
                        borderRadius: 12,
                        border: `2px solid ${T.purple}`,
                        background: "#faf5ff",
                        fontWeight: 800,
                        fontSize: 13,
                        color: T.purple,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontFamily: "inherit",
                      }}
                    >
                      ДАРААГИЙНХ
                      <Ic n="chevRight" size={16} color={T.purple} />
                    </button>
                  )}
                </div>

                <div style={{ marginTop: 22, position: "relative" }}>
                  <button
                    type="button"
                    onClick={requestSolution}
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
                    {solutionOpenFor === qIndex
                      ? "БОДОЛТ ХААХ"
                      : solutionsUnlocked.has(qIndex)
                        ? "БОДОЛТ ХАРАХ"
                        : "БОДОЛТ ХИЙЛГЭХ"}
                  </button>
                  {!solutionsUnlocked.has(qIndex) && (
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
                      <CoinIcon size={16} />
                      1ш
                    </div>
                  )}
                  <p
                    style={{
                      textAlign: "center",
                      marginTop: 10,
                      fontSize: 12,
                      color: T.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <CoinIcon size="xs" />
                    1 зоос · үлдсэн{" "}
                    <strong style={{ color: T.text }}>{coins ?? "—"}</strong>
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <CoinSpendModal
        open={coinModalOpen}
        onClose={() => setCoinModalOpen(false)}
        coinCost={1}
        balance={coins ?? session?.user?.coins ?? 0}
        lines={["Бодолт хийлгэхийн тулд 1 зоос зарцуулна."]}
        onConfirm={confirmBuySolution}
        confirmLoading={coinModalBusy}
      />
    </div>
  );
}

function QuestionCard({
  q,
  qIndex,
  selected,
  onSelect,
  readOnly,
  showFeedback,
  correctId,
  favorites,
  onToggleFav,
  onCopy,
  solutionOpen,
  solutionText,
  showSolutionUi,
}: {
  q: EesQuestion;
  qIndex: number;
  selected?: EesOption["id"];
  onSelect: (id: EesOption["id"]) => void;
  readOnly?: boolean;
  showFeedback?: boolean;
  correctId?: EesOption["id"];
  favorites: Set<number>;
  onToggleFav: () => void;
  onCopy: () => void;
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
          <button type="button" style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }} aria-label="Хуулах" onClick={onCopy}>
            <MiniCopy />
          </button>
          <button type="button" style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }} onClick={onToggleFav} aria-label="Дуртай">
            <MiniHeart filled={favorites.has(qIndex)} />
          </button>
        </div>
      </div>

      {q.type !== "open" && (
        <p style={{ margin: "12px 0 14px", fontSize: 15, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>{q.text}</p>
      )}

      {q.contextNote && q.type === "choice" && (
        <div style={{ marginBottom: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 13, color: T.textSub, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {q.contextNote}
        </div>
      )}
      {q.illustration && (
        <div style={{ marginBottom: 16, padding: "10px 8px", background: "#f8fafc", borderRadius: 14, border: `1px solid ${T.border}` }}>
          <ExamFigure kind={q.illustration} />
        </div>
      )}
      {q.type === "open" && (
        <div style={{ padding: "14px", borderRadius: 12, background: "#fff7ed", border: "1px solid #fdba74", fontSize: 13, color: "#9a3412", lineHeight: 1.65, whiteSpace: "pre-wrap", marginBottom: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>{q.text}</div>
          {q.contextNote}
          <p style={{ marginTop: 12, fontSize: 12, color: "#c2410c" }}>Хариултыг хариултын хуудсанд [a,b,c…] форматаар тэмдэглэнэ үү.</p>
        </div>
      )}
      {q.type !== "open" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt) => {
          const isSel = selected === opt.id;
          const isCorrect = showFeedback && correctId === opt.id;
          const isWrong = showFeedback && isSel && correctId && opt.id !== correctId;
          let border: string = isSel ? T.blue : T.border;
          let bg: string = isSel ? T.blueLight : "#fafafa";
          if (isCorrect && (isSel || selected)) {
            border = T.green;
            bg = T.greenLight;
          }
          if (isWrong) {
            border = T.red;
            bg = "#fef2f2";
          }
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
                border: `2px solid ${border}`,
                background: bg,
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
      )}

      {showSolutionUi && solutionOpen && solutionText && q.type === "choice" && (
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
