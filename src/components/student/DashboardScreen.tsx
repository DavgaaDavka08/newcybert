"use client";
import React from "react";
import { T } from "@/styles/tokens";
import { Badge, Label, Ic, Bar, Ring } from "@/components/ui";
import { Topbar } from "@/components/layout/Topbar";
import { getRank, LEADERBOARD } from "@/lib/mock-data";
import type { AppState, Screen } from "@/types";

interface Props {
  onNav: (s: Screen) => void;
  state: AppState;
}

const MISSIONS = [
  { label: "5 асуулт зөв хариулах", done: 3, total: 5, xp: 20, color: T.blue },
  { label: "1 сорил дуусгах", done: 0, total: 1, xp: 50, color: T.purple },
  { label: "Streak хадгалах", done: 1, total: 1, xp: 10, color: T.amber },
];

export function DashboardScreen({ onNav, state }: Props) {
  const rank = getRank(state.xp);
  const xpInLevel = state.xp % 100;

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
            label: "Нийт сорил",
            value: "12",
            sub: "2 энэ долоо",
            color: T.purple,
            icon: "exam",
          },
          {
            label: "Дундаж оноо",
            value: "72%",
            sub: "5% өссөн",
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

      {/* ── Daily missions ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "18px 20px",
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
          marginBottom: 22,
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
          <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>
            🎯 Өдрийн даалгавар
          </div>
          <Badge color={T.purple}>+80 XP боломж</Badge>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10,
          }}
        >
          {MISSIONS.map((m, i) => {
            const pct = Math.round((m.done / m.total) * 100);
            const done = m.done >= m.total;
            return (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${done ? m.color + "40" : T.border}`,
                  background: done ? m.color + "08" : "#FAFBFC",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: done ? m.color : T.textSub,
                    }}
                  >
                    {m.label}
                  </span>
                  {done && (
                    <span
                      style={{
                        fontSize: 10,
                        background: m.color,
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 99,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <Bar pct={pct} color={m.color} height={4} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <span style={{ fontSize: 10, color: T.muted }}>
                    {m.done}/{m.total}
                  </span>
                  <span
                    style={{ fontSize: 10, color: m.color, fontWeight: 700 }}
                  >
                    +{m.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
          {LEADERBOARD.slice(0, 4).map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: i < 3 ? 10 : 0,
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
          ))}
        </div>
      </div>
    </div>
  );
}
