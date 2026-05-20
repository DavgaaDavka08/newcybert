// src/app/(auth)/login/page.tsx
"use client";
import "../auth.css";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { PROVINCES, SCHOOL_GRADES } from "@/lib/mn-constants";
import { getLoginCallbackUrl, mapAuthError } from "@/lib/auth-redirect";

/* ─── Decorative shapes on the right bg ─── */
type Shape = { type: string; x: number; y: number; size: number; color: string; rot?: number };
const BG_SHAPES: Shape[] = [
  { type: "circle",   x: 88, y:  8, size: 120, color: "rgba(94,206,186,0.10)" },
  { type: "circle",   x: 60, y: 85, size:  90, color: "rgba(185,245,220,0.18)" },
  { type: "triangle", x: 95, y: 50, size:  56, color: "rgba(94,206,186,0.16)", rot: -12 },
  { type: "triangle", x: 65, y: 12, size:  44, color: "rgba(56,189,160,0.13)", rot: 20 },
  { type: "rect",     x: 70, y: 68, size:  48, color: "rgba(94,206,186,0.16)", rot: 18 },
  { type: "star",     x: 78, y: 30, size:  20, color: "rgba(56,189,160,0.40)" },
  { type: "star",     x: 92, y: 72, size:  16, color: "rgba(94,206,186,0.45)" },
  { type: "star",     x: 58, y: 55, size:  14, color: "rgba(56,189,160,0.30)" },
];

function StarSvg({ size, color }: { size: number; color: string }) {
  const s = size / 2;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const o   = (i * 72 - 90) * (Math.PI / 180);
    const inn = o + 36 * (Math.PI / 180);
    return `${s + s * Math.cos(o)},${s + s * Math.sin(o)} ${s + s * 0.4 * Math.cos(inn)},${s + s * 0.4 * Math.sin(inn)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={pts} fill={color} />
    </svg>
  );
}

/* ─── input / label shared styles ─── */
const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)", color: "#E2E8F0",
  fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontSize: 12, color: "#94A3B8", fontWeight: 700,
  marginBottom: 5, display: "block", letterSpacing: 0.3,
};

/* ════════════════════════════════════════════
   LOGIN FORM
════════════════════════════════════════════ */
function LoginTab({ onSwitch, callbackUrl }: { onSwitch: () => void; callbackUrl: string }) {
  const isAdminLogin = callbackUrl.startsWith("/admin");
  const [email, setEmail]       = useState(isAdminLogin ? "admin@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const dest = getLoginCallbackUrl(callbackUrl);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });
      if (res?.error) {
        setError(
          isAdminLogin
            ? "И-мэйл эсвэл нууц үг буруу. Имэйл = ADMIN_EMAIL, нууц = ADMIN_PASS (имэйлийг нууц талбарт бүү оруул)."
            : mapAuthError(res.error),
        );
        setLoading(false);
        return;
      }
      if (!res?.ok) {
        setError("Нэвтрэлт амжилтгүй боллоо. Дахин оролдоно уу.");
        setLoading(false);
        return;
      }
      window.location.href = dest;
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
      setLoading(false);
    }
  }

  return (
    <>
      {isAdminLogin && (
        <div style={{
          background: "rgba(79,70,229,0.12)", border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: 8, padding: "12px 14px", marginBottom: 14,
          color: "#C7D2FE", fontSize: 12, lineHeight: 1.6,
        }}>
          <strong style={{ fontSize: 14, color: "#E0E7FF" }}>Admin нэвтрэх</strong>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <div><span style={{ color: "#94A3B8" }}>И-мэйл:</span> <strong>admin@gmail.com</strong></div>
            <div><span style={{ color: "#94A3B8" }}>Нууц үг:</span> <strong>TCB-757</strong></div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#FCA5A5", fontWeight: 600 }}>
            ⚠ Нууц үг талбарт имэйл бүү оруул!
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8, padding: "10px 12px", marginBottom: 14,
          color: "#FCA5A5", fontSize: 13,
        }}>⚠ {error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>И-МЭЙЛ</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={isAdminLogin ? "admin@gmail.com" : "example@mail.com"} required style={inp} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>НУУЦ ҮГ</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isAdminLogin ? "TCB-757 (ADMIN_PASS)" : "••••••••"} required
              style={{ ...inp, paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 15,
            }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "#64748B" }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: "#4361EE" }} />
            Намайг санах
          </label>
          <a href="/forgot-password" style={{ fontSize: 12, color: "#4361EE", textDecoration: "none", fontWeight: 700 }}>
            Нууц үг мартсан?
          </a>
        </div>

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: loading ? "#2d52c4" : "#4361EE",
          color: "#fff", fontWeight: 800, fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 18px rgba(67,97,238,0.35)",
          transition: "background .2s",
        }}>
          {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#64748B" }}>
        Бүртгэл байхгүй юу?{" "}
        <button onClick={onSwitch} style={{
          color: "#4361EE", fontWeight: 700, background: "none",
          border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
        }}>
          Бүртгүүлэх →
        </button>
      </p>

      <p style={{ textAlign: "center", marginTop: 6, fontSize: 12 }}>
        <a href="/login" style={{ color: "#475569", textDecoration: "none" }}>🔐 Admin нэвтрэх</a>
      </p>
    </>
  );
}

/* ════════════════════════════════════════════
   REGISTER FORM
════════════════════════════════════════════ */
function RegisterTab({ onSwitch }: { onSwitch: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    phone: "", province: "", school: "", grade: "", role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  function upd(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const res  = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        grade: form.grade === "" ? undefined : Number(form.grade),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(data.message);
    setTimeout(async () => {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.ok) {
        window.location.href = "/dashboard";
      }
    }, 1200);
  }

  return (
    <>
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8, padding: "10px 12px", marginBottom: 14, color: "#FCA5A5", fontSize: 13,
        }}>⚠ {error}</div>
      )}
      {success && (
        <div style={{
          background: "rgba(94,206,186,0.1)", border: "1px solid rgba(94,206,186,0.3)",
          borderRadius: 8, padding: "10px 12px", marginBottom: 14, color: "#5ECEBA", fontSize: 13,
        }}>✅ {success}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-register-grid" style={{ marginBottom: 10 }}>
          <div>
            <label style={lbl}>ОВОГ</label>
            <input value={form.lastName} onChange={e => upd("lastName", e.target.value)}
              placeholder="Дорж" required style={inp} />
          </div>
          <div>
            <label style={lbl}>НЭР</label>
            <input value={form.firstName} onChange={e => upd("firstName", e.target.value)}
              placeholder="Болд" required style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>И-МЭЙЛ</label>
          <input type="email" value={form.email} onChange={e => upd("email", e.target.value)}
            placeholder="example@mail.com" required style={inp} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>НУУЦ ҮГ</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"}
              value={form.password} onChange={e => upd("password", e.target.value)}
              placeholder="••••• (6+ тэмдэгт)" required
              style={{ ...inp, paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#475569", cursor: "pointer",
            }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div className="auth-register-grid" style={{ marginBottom: 10 }}>
          <div>
            <label style={lbl}>УТАСНЫ ДУГААР</label>
            <input value={form.phone} onChange={e => upd("phone", e.target.value)}
              placeholder="9900XXXX" style={inp} />
          </div>
          <div>
            <label style={lbl}>АЙМАГ / НИЙСЛЭЛ</label>
            <select value={form.province} onChange={e => upd("province", e.target.value)}
              style={{ ...inp, cursor: "pointer" }}>
              <option value="">-- Сонгох --</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>СУРГУУЛЬ</label>
          <input value={form.school} onChange={e => upd("school", e.target.value)}
            placeholder="Сургуулийн нэр" style={inp} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>АНГИ</label>
          <select
            value={form.grade}
            onChange={e => upd("grade", e.target.value)}
            required
            style={{ ...inp, cursor: "pointer" }}
          >
            <option value="">-- Сонгох --</option>
            {SCHOOL_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}-р анги
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: loading ? "#2d52c4" : "#4361EE",
          color: "#fff", fontWeight: 800, fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 18px rgba(67,97,238,0.35)",
        }}>
          {loading ? "Бүртгэж байна..." : "Бүртгүүлэх →"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#64748B" }}>
        Бүртгэлтэй юу?{" "}
        <button onClick={onSwitch} style={{
          color: "#4361EE", fontWeight: 700, background: "none",
          border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
        }}>
          Нэвтрэх →
        </button>
      </p>
    </>
  );
}

/* ════════════════════════════════════════════
   MAIN CONTENT (uses useSearchParams)
════════════════════════════════════════════ */
function AuthContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (searchParams.get("register") === "1") setTab("register");
  }, [searchParams]);

  return (
    <div className="auth-page">
      {/* ── LEFT PANEL ── */}
      <div className="auth-panel-left">
        {/* Glow behind mascot */}
        <div style={{
          position: "absolute", width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,210,63,0.15) 0%, rgba(94,206,186,0.06) 50%, transparent 70%)",
          top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }} />

        {/* Left scattered shapes */}
        {[
          { x: 10, y: 10, size: 70, color: "rgba(94,206,186,0.08)", type: "circle" },
          { x: 85, y: 80, size: 50, color: "rgba(94,206,186,0.08)", type: "circle" },
          { x: 15, y: 75, size: 40, color: "rgba(94,206,186,0.12)", type: "rect", rot: 15 },
          { x: 80, y: 15, size: 35, color: "rgba(56,189,160,0.15)", type: "triangle", rot: -10 },
        ].map((sh, i) => (
          <div key={i} style={{
            position: "absolute", left: `${sh.x}%`, top: `${sh.y}%`,
            transform: `translate(-50%,-50%) rotate(${sh.rot ?? 0}deg)`, pointerEvents: "none",
          }}>
            {sh.type === "circle" && (
              <div style={{ width: sh.size, height: sh.size, borderRadius: "50%", background: sh.color }} />
            )}
            {sh.type === "rect" && (
              <div style={{
                width: sh.size, height: sh.size, borderRadius: 6, background: "transparent",
                border: `2.5px solid ${sh.color}`,
              }} />
            )}
            {sh.type === "triangle" && (
              <svg width={sh.size} height={sh.size} viewBox="0 0 60 60">
                <polygon points="30,4 56,56 4,56" fill="transparent" stroke={sh.color} strokeWidth="4" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}

        <div className="auth-logo-wrap">
          <img src="/cyberphysic-logo.png" alt="CyberPhysic" />
        </div>

        <div className="auth-hero">
          <div className="auth-hero-mascot">
            <img src="/cyberpysics.png" alt="mascot" />
          </div>
          <h2>CyberPhysics</h2>
          <p>
            Физикийг тоглоомоор сур.<br />XP цуглуул. Streak хадгал.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-panel-right">
        {/* Background shapes */}
        {BG_SHAPES.map((sh, i) => (
          <div key={i} style={{
            position: "absolute", left: `${sh.x}%`, top: `${sh.y}%`,
            transform: `translate(-50%,-50%) rotate(${sh.rot ?? 0}deg)`,
            pointerEvents: "none", zIndex: 0,
          }}>
            {sh.type === "circle" && (
              <div style={{ width: sh.size, height: sh.size, borderRadius: "50%", background: sh.color }} />
            )}
            {sh.type === "rect" && (
              <div style={{
                width: sh.size, height: sh.size, borderRadius: 8, background: "transparent",
                border: `3px solid ${sh.color}`,
              }} />
            )}
            {sh.type === "triangle" && (
              <svg width={sh.size} height={sh.size} viewBox="0 0 60 60">
                <polygon points="30,4 56,56 4,56" fill="transparent" stroke={sh.color} strokeWidth="5" strokeLinejoin="round" />
              </svg>
            )}
            {sh.type === "star" && <StarSvg size={sh.size} color={sh.color} />}
          </div>
        ))}

        <div className="auth-form-card">
          <div className="auth-tabs">
            {(["login", "register"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`auth-tab-btn ${tab === t ? "auth-tab-btn--active" : "auth-tab-btn--inactive"}`}
              >
                {t === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
              </button>
            ))}
          </div>

          {authError && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 14,
                color: "#FCA5A5",
                fontSize: 13,
              }}
            >
              ⚠ {mapAuthError(authError)}
            </div>
          )}

          {tab === "login"
            ? <LoginTab onSwitch={() => setTab("register")} callbackUrl={callbackUrl} />
            : <RegisterTab onSwitch={() => setTab("login")} />
          }
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   PAGE EXPORT (Suspense wrapper)
════════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0D0D15" }} />}>
      <AuthContent />
    </Suspense>
  );
}
