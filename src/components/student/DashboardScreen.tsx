"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui";
import { Topbar } from "@/components/layout/Topbar";
import { useAppState } from "@/lib/app-state-context";
import {
  XpProgressCard,
  LeaderboardPanel,
  StreakIcon,
  type LbEntry,
} from "@/components/gamification";
import type { AppState, Screen } from "@/types";

interface ExamPreview {
  _id: string;
  title: string;
  duration: number;
  questions: { id: string }[];
  hasAttempt: boolean;
}

interface Props {
  onNav: (s: Screen) => void;
  state: AppState;
}

type GamificationData = {
  progress: {
    xpInLevel: number;
    xpToNext: number;
    remaining: number;
    pct: number;
    nextLevel: number;
  };
  xpHistory: { amount: number; reason: string }[];
  nextLevelReward?: { level: number; label: string };
  coinGoal: { target: number; remaining: number; label: string };
  lives: number;
  maxLives: number;
  nextRefillAt: number | null;
};

export function DashboardScreen({ onNav, state }: Props) {
  const router = useRouter();
  const { refreshStats } = useAppState();
  const [exams, setExams] = useState<ExamPreview[]>([]);
  const [leaderboard, setLeaderboard] = useState<LbEntry[]>([]);
  const [gData, setGData] = useState<GamificationData | null>(null);
  const [streakToast, setStreakToast] = useState<{ coins: number; streak: number; milestone?: string } | null>(null);

  const loadGamification = useCallback(() => {
    fetch("/api/user/gamification")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.demo) setGData(d);
      })
      .catch(() => {});
  }, []);

  const loadLeaderboard = useCallback((period: string) => {
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const e = d?.entries;
        setLeaderboard(
          Array.isArray(e)
            ? e.map((p: LbEntry) => ({
                id: p.id,
                name: p.name,
                level: p.level,
                xp: p.xp,
                periodXp: p.periodXp,
              }))
            : [],
        );
      })
      .catch(() => setLeaderboard([]));
  }, []);

  useEffect(() => {
    fetch("/api/user/checkin", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || d.alreadyDone) return;
        setStreakToast({
          coins: d.coinReward,
          streak: d.streak,
          milestone: d.milestone?.badge,
        });
        setTimeout(() => setStreakToast(null), 5000);
        void refreshStats();
        loadGamification();
      })
      .catch(() => {});
  }, [refreshStats, loadGamification]);

  useEffect(() => {
    loadGamification();
    loadLeaderboard("all");
  }, [loadGamification, loadLeaderboard]);

  useEffect(() => {
    fetch("/api/exam/exams")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setExams(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  const lives = gData?.lives ?? state.lives;
  const maxLives = gData?.maxLives ?? 5;
  return (
    <div className="dash-page">
      {streakToast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 300,
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            color: "#fff",
            padding: "16px 24px",
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 260,
          }}
        >
          <StreakIcon size={36} glow animate />
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 2 }}>
              {streakToast.streak} өдрийн streak!
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              🪙 +{streakToast.coins} зоос
              {streakToast.milestone && (
                <span style={{ marginLeft: 6, color: "#FFD700" }}>🏅 Badge!</span>
              )}
            </div>
          </div>
        </div>
      )}

      <Topbar
        title="Нүүр хуудас"
        sub={`Сайн уу, ${state.name} — ${new Date().toLocaleDateString("mn-MN", { weekday: "long", month: "long", day: "numeric" })}`}
        appState={state}
        lives={lives}
        maxLives={maxLives}
        nextRefillAt={gData?.nextRefillAt ?? null}
        coinGoal={gData?.coinGoal}
      />

      <div
        className="dash-hero"
        style={{
          background: "linear-gradient(120deg, #0D9488 0%, #2563EB 60%, #7C3AED 100%)",
          borderRadius: 18,
          padding: "28px 32px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(13,148,136,0.25)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            🎯 ЭЕШ-д бэлтгэх
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>
            Физикийн давталт, шалгалтаар түвшин ахиулаарай
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 12 }}>
            Level {state.level} · {gData?.progress ? `${gData.progress.xpInLevel}/${gData.progress.xpToNext} XP` : `${state.xp} XP`}
          </div>
          <button
            onClick={() => onNav("game")}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              background: "#FFD23F",
              color: "#0F172A",
              fontWeight: 800,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(255,210,63,0.45)",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            Давталт эхлэх →
          </button>
        </div>
        <img
          src="/cyberpysics.png"
          alt="mascot"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          style={{ height: 110, objectFit: "contain", mixBlendMode: "screen", zIndex: 1 }}
        />
      </div>

      {gData && (
        <div className="dash-gamification-grid" style={{ marginBottom: 18 }}>
          <XpProgressCard
            xp={state.xp}
            level={state.level}
            progress={gData.progress}
            xpHistory={gData.xpHistory}
            nextLevelReward={gData.nextLevelReward}
          />
          <LeaderboardPanel entries={leaderboard} onPeriodChange={loadLeaderboard} />
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <div
          style={{
            background: "linear-gradient(120deg, #1e3a8a 0%, #4F46E5 100%)",
            borderRadius: 18,
            padding: "20px 24px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 24px rgba(79,70,229,0.25)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", marginBottom: 4 }}>
              📝 Шалгалт
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>Мэдлэгээ шалгаж XP аваарай</div>
          </div>
          <button
            onClick={() => router.push("/dashboard/exam")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#FFD23F",
              color: "#1e3a8a",
              fontWeight: 800,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            Бүгдийг харах →
          </button>
        </div>

        {exams.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: `1px solid ${T.border}`, textAlign: "center", color: T.muted, fontSize: 13 }}>
            Одоогоор шалгалт байхгүй
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {exams.map((exam) => (
              <div
                key={exam._id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: `1.5px solid ${exam.hasAttempt ? T.green + "40" : T.border}`,
                  padding: "16px 18px",
                  boxShadow: T.shadow,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>{exam.title}</div>
                <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 11, color: T.muted }}>
                  <span>
                    <Ic n="history" size={11} color={T.muted} /> {exam.duration}мин
                  </span>
                  <span>
                    <Ic n="task" size={11} color={T.muted} /> {exam.questions?.length ?? 0}
                  </span>
                </div>
                {exam.hasAttempt ? (
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: T.greenLight, color: T.green, fontWeight: 700, fontSize: 12, textAlign: "center" }}>
                    ✓ Өгсөн
                  </div>
                ) : (
                  <button
                    onClick={() => router.push(`/dashboard/exam/${exam._id}`)}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 8,
                      border: "none",
                      background: "#4F46E5",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}
                  >
                    Эхлэх →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
