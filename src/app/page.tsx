// src/app/page.tsx
"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const BOKEH = [
    { x: 18, y: 14, col: "#FFD23F", r: 4 },
    { x: 82, y: 22, col: "#5ECEBA", r: 3 },
    { x: 12, y: 60, col: "#5ECEBA", r: 4 },
    { x: 88, y: 58, col: "#FFD23F", r: 3 },
    { x: 50, y:  8, col: "#ffffff", r: 3 },
    { x: 30, y: 80, col: "#ffffff", r: 2 },
    { x: 72, y: 78, col: "#FFD23F", r: 4 },
    { x: 25, y: 35, col: "#5ECEBA", r: 2 },
    { x: 65, y: 90, col: "#FFD23F", r: 2 },
    { x: 92, y: 40, col: "#5ECEBA", r: 3 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07070D",
      fontFamily: "Nunito, 'Plus Jakarta Sans', sans-serif",
      color: "#fff",
      overflowX: "hidden",
    }}>
      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(7,7,13,0.88)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto", padding: "0 32px",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <img
            src="/cyberphysic-logo.png"
            alt="CyberPhysic"
            style={{ height: 38, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
          {/* Nav */}
          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => router.push("/login")} style={{
              padding: "8px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              color: "#CBD5E1", background: "transparent", cursor: "pointer",
              border: "1.5px solid rgba(255,255,255,0.14)", fontFamily: "inherit",
            }}>
              Нэвтрэх
            </button>
            <button onClick={() => router.push("/login?register=1")} style={{
              padding: "8px 22px", borderRadius: 10, fontWeight: 800, fontSize: 14,
              color: "#07070D", background: "#FFD23F", border: "none", cursor: "pointer",
              boxShadow: "0 4px 18px rgba(255,210,63,0.4)", fontFamily: "inherit",
            }}>
              Татах
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <main style={{ position: "relative", textAlign: "center", padding: "72px 24px 100px" }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,210,63,0.15) 0%, rgba(94,206,186,0.08) 45%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Bokeh dots */}
        {BOKEH.map((d, i) => (
          <div key={i} style={{
            position: "absolute", left: `${d.x}%`, top: `${d.y}%`,
            width: d.r, height: d.r, borderRadius: "50%",
            background: d.col, opacity: 0.3, pointerEvents: "none", zIndex: 0,
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Mascot */}
          <div style={{ display: "inline-block", animation: "float 4s ease-in-out infinite", marginBottom: 28 }}>
            <img
              src="/cyberpysics.png"
              alt="CyberPhysics mascot"
              style={{
                width: 180, height: 180, objectFit: "contain",
                mixBlendMode: "screen",
                filter: "drop-shadow(0 0 48px rgba(255,210,63,0.6))",
              }}
            />
          </div>

          {/* Heading */}
          <h1 style={{ margin: "0 0 18px", lineHeight: 1.1 }}>
            <span style={{
              display: "block",
              fontSize: "clamp(30px, 5vw, 50px)",
              fontWeight: 800, color: "#E2E8F0",
            }}>
              Физикийг
            </span>
            <span style={{
              display: "block",
              fontSize: "clamp(34px, 6vw, 60px)",
              fontWeight: 900,
              background: "linear-gradient(90deg, #FFD23F 0%, #5ECEBA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              CyberPhysics-тай сур
            </span>
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 16, color: "#94A3B8", lineHeight: 1.75,
            marginBottom: 40, maxWidth: 520, marginLeft: "auto", marginRight: "auto",
          }}>
            Сурагчид өөрсдийнхөө темпээр давтаж, XP цуглуулж, бодлого бүрт AI тайлбар авах боломжтой.{" "}
            <span style={{ color: "#FFD23F", fontWeight: 700 }}>CyberPhysics</span>{" "}
            — таны хувийн физикийн багш.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/login?register=1")} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 28px", borderRadius: 14, fontWeight: 800, fontSize: 15,
              color: "#07070D", background: "#FFD23F", border: "none", cursor: "pointer",
              boxShadow: "0 8px 28px rgba(255,210,63,0.45)", fontFamily: "inherit",
              transition: "transform .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.65, letterSpacing: 0.5 }}>ҮНЭГҮЙ</div>
                <div>Эхлэх</div>
              </div>
            </button>

            <button onClick={() => router.push("/login")} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 28px", borderRadius: 14, fontWeight: 800, fontSize: 15,
              color: "#fff", background: "rgba(255,255,255,0.07)", cursor: "pointer",
              border: "1.5px solid rgba(255,255,255,0.15)", fontFamily: "inherit",
              transition: "transform .2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, letterSpacing: 0.5 }}>АЛЬ ХЭДИЙН</div>
                <div>Бүртгэлтэй</div>
              </div>
            </button>
          </div>

          {/* Scroll arrow */}
          <div style={{
            marginTop: 56, color: "#475569",
            animation: "bounce 2s ease-in-out infinite",
            display: "flex", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </main>

      {/* ── Features ── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {[
            { icon: "🎮", title: "XP тоглоом", desc: "Асуулт бодоод XP, coin цуглуул" },
            { icon: "🤖", title: "AI тайлбар", desc: "Буруу хариулт бүрт нарийвчилсан тайлбар" },
            { icon: "🔥", title: "Streak", desc: "Өдөр бүр тоглосоор хадгал" },
            { icon: "🏆", title: "Leaderboard", desc: "Найзуудтайгаа XP-ээр өрсөлд" },
          ].map(f => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "22px 20px",
              transition: "border-color .2s, transform .2s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(255,210,63,0.3)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes float  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-18px)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)}  50%{transform:translateY(7px)}  }
      `}</style>
    </div>
  );
}
