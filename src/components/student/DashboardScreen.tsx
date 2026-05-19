"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/styles/tokens";
import { Label, Ic, Bar, Ring } from "@/components/ui";
import { Topbar } from "@/components/layout/Topbar";
import { getRank } from "@/lib/ranks";
import type { AppState, Screen } from "@/types";

interface ExamPreview {
  _id: string; title: string; duration: number;
  questions: { id: string }[]; hasAttempt: boolean;
}

interface Props {
  onNav: (s: Screen) => void;
  state: AppState;
}


interface LeaderEntry {
  id: string;
  name: string;
  level: number;
  xp: number;
}

export function DashboardScreen({ onNav, state }: Props) {
  const rank = getRank(state.xp);
  const xpInLevel = state.xp % 100;
  const router = useRouter();
  const [exams, setExams] = useState<ExamPreview[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [examAttemptsCount, setExamAttemptsCount] = useState<number | null>(null);
  const [avgExamScorePct, setAvgExamScorePct] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/exam/exams")
      .then(r => r.ok ? r.json() : [])
      .then(d => setExams(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const e = d?.entries;
        setLeaderboard(Array.isArray(e) ? e.slice(0, 5) : []);
      })
      .catch(() => setLeaderboard([]));
  }, []);

  useEffect(() => {
    fetch("/api/user/dashboard-summary")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return;
        setExamAttemptsCount(typeof d.examAttemptsCount === "number" ? d.examAttemptsCount : 0);
        setAvgExamScorePct(typeof d.avgExamScorePct === "number" ? d.avgExamScorePct : null);
      })
      .catch(() => {
        setExamAttemptsCount(null);
        setAvgExamScorePct(null);
      });
  }, []);

  return (
    <div>
      <Topbar
        title="Нүүр хуудас"
        sub={`Сайн уу, ${state.name} — ${new Date().toLocaleDateString("mn-MN", { weekday: "long", month: "long", day: "numeric" })}`}
        appState={state}
      />

      {/* ── Hero banner ── */}
      <div
        style={{
          background:
            "linear-gradient(120deg, #0D9488 0%, #2563EB 60%, #7C3AED 100%)",
          borderRadius: 18,
          padding: "28px 32px",
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(13,148,136,0.25)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 160,
            top: -30,
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: -40,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
        <div style={{ zIndex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            🎯 ЭЕШ-д бэлтгэх
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 22,
              color: "#fff",
              lineHeight: 1.3,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Физикийг хамт сур,
            <br />
            XP цуглуул!
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
          style={{
            height: 120,
            width: "auto",
            objectFit: "contain",
            mixBlendMode: "screen",
            filter: "drop-shadow(0 0 20px rgba(255,210,63,0.5))",
            zIndex: 1,
            flexShrink: 0,
          }}
        />
      </div>

      {/* ── Stat strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 22,
        }}
      >
        {[
          {
            label: "Миний дэвшил",
            value: `Level ${state.level}`,
            sub: `${xpInLevel}% дараагийн`,
            color: T.blue,
            icon: "trophy",
          },
          {
            label: "Нийт шалгалт",
            value: examAttemptsCount == null ? "—" : String(examAttemptsCount),
            sub: "Өгсөн шалгалт",
            color: T.purple,
            icon: "exam",
          },
          {
            label: "Дундаж оноо",
            value: avgExamScorePct == null ? "—" : `${avgExamScorePct}%`,
            sub: avgExamScorePct == null ? "Шалгалт өгөөд үүснэ" : "Шалгалтын дундаж",
            color: T.green,
            icon: "award",
          },
          {
            label: "Нийт XP",
            value: state.xp.toLocaleString(),
            sub: "",
            color: T.amber,
            icon: "zap",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "16px 18px",
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: s.color + "14",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ic n={s.icon} size={20} color={s.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: T.muted,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: T.text,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {s.value}
              </div>
              {s.sub && <div
                style={{
                  fontSize: 11,
                  color: s.color,
                  fontWeight: 600,
                  marginTop: 1,
                }}
              >
                {s.sub}
              </div>}
            </div>
          </div>
        ))}
      </div>


      {/* ── Bottom: level + leaderboard ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Level card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "18px",
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Label>Таны дэвшил</Label>
            <Ring pct={xpInLevel} size={50} stroke={5} color={rank.color}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.text }}>
                {xpInLevel}%
              </span>
            </Ring>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 20,
              color: T.text,
              marginBottom: 6,
            }}
          >
            Level {state.level}
          </div>
          <Bar pct={xpInLevel} color={rank.color} height={6} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: T.muted }}>{state.xp} XP</span>
            <span style={{ fontSize: 11, color: rank.color, fontWeight: 700 }}>
              {rank.name}
            </span>
          </div>
        </div>

        {/* Mini leaderboard */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "18px",
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: T.text,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ic n="trophy" size={14} color={T.amber} /> Шилдэг оюутнууд
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ fontSize: 12, color: T.muted, padding: "8px 0", textAlign: "center" }}>
              Жагсаалт хоосон байна
            </div>
          ) : (
            leaderboard.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: i < leaderboard.length - 1 ? 10 : 0,
                padding: "6px 8px",
                borderRadius: 8,
                background: i === 0 ? T.amber + "0a" : "transparent",
              }}
            >
              <span
                style={{
                  width: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  color: i === 0 ? T.amber : T.muted,
                  textAlign: "center",
                }}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>Lv {p.level}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.blue }}>
                {p.xp.toLocaleString()} XP
              </span>
            </div>
          ))
          )}
        </div>
      </div>

      {/* ── Exam section ── */}
      <div style={{ marginTop: 22 }}>
        <div
          style={{
            background: "linear-gradient(120deg, #1e3a8a 0%, #4F46E5 100%)",
            borderRadius: 18, padding: "20px 24px", marginBottom: 14,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 6px 24px rgba(79,70,229,0.25)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              📝 Шалгалтын систем
            </div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", marginBottom: 4 }}>
              Шалгалт өгч мэдлэгээ баталгаажуулна уу
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Хугацаатай шалгалт, автомат үр дүн
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/exam")}
            style={{
              padding: "10px 20px", borderRadius: 10, background: "#FFD23F",
              color: "#1e3a8a", fontWeight: 800, fontSize: 13, border: "none",
              cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif",
              boxShadow: "0 4px 14px rgba(255,210,63,0.4)", whiteSpace: "nowrap",
            }}
          >
            Бүгдийг харах →
          </button>
        </div>

        {exams.length === 0 ? (
          <div
            style={{
              background: "#fff", borderRadius: 14, padding: "24px",
              border: `1px solid ${T.border}`, textAlign: "center", color: T.muted,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 13 }}>Одоогоор шалгалт байхгүй байна</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {exams.map((exam) => (
              <div
                key={exam._id}
                style={{
                  background: "#fff", borderRadius: 14,
                  border: `1.5px solid ${exam.hasAttempt ? T.green + "40" : T.border}`,
                  padding: "16px 18px", boxShadow: T.shadow,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {exam.title}
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 3 }}>
                    <Ic n="history" size={11} color={T.muted} /> {exam.duration}мин
                  </span>
                  <span style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 3 }}>
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
                      width: "100%", padding: "8px", borderRadius: 8, border: "none",
                      background: "#4F46E5", color: "#fff", fontWeight: 700, fontSize: 12,
                      cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif",
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
