// src/app/(auth)/login/page.tsx
"use client";
import "../auth.css";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PROVINCES, SCHOOL_GRADES } from "@/lib/mn-constants";
import {
  getSafeCallbackUrl,
  mapAuthError,
  waitForSession,
} from "@/lib/auth-redirect";
import { Ic } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";

type Shape = {
  type: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rot?: number;
};
const BG_SHAPES: Shape[] = [
  { type: "circle", x: 88, y: 8, size: 120, color: "rgba(94,206,186,0.10)" },
  { type: "circle", x: 60, y: 85, size: 90, color: "rgba(185,245,220,0.18)" },
  {
    type: "triangle",
    x: 95,
    y: 50,
    size: 56,
    color: "rgba(94,206,186,0.16)",
    rot: -12,
  },
  {
    type: "triangle",
    x: 65,
    y: 12,
    size: 44,
    color: "rgba(56,189,160,0.13)",
    rot: 20,
  },
  {
    type: "rect",
    x: 70,
    y: 68,
    size: 48,
    color: "rgba(94,206,186,0.16)",
    rot: 18,
  },
  { type: "star", x: 78, y: 30, size: 20, color: "rgba(56,189,160,0.40)" },
  { type: "star", x: 92, y: 72, size: 16, color: "rgba(94,206,186,0.45)" },
  { type: "star", x: 58, y: 55, size: 14, color: "rgba(56,189,160,0.30)" },
];

function StarSvg({ size, color }: { size: number; color: string }) {
  const s = size / 2;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const o = (i * 72 - 90) * (Math.PI / 180);
    const inn = o + 36 * (Math.PI / 180);
    return `${s + s * Math.cos(o)},${s + s * Math.sin(o)} ${s + s * 0.4 * Math.cos(inn)},${s + s * 0.4 * Math.sin(inn)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={pts} fill={color} />
    </svg>
  );
}

/* ════════════════════════════════════════════
   LOGIN FORM
════════════════════════════════════════════ */
function LoginTab({
  onSwitch,
  callbackUrl,
}: {
  onSwitch: () => void;
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const em = email.trim().toLowerCase();
    const pw = password.trim();
    try {
      const res = await signIn("credentials", {
        email: em,
        password: pw,
        redirect: false,
      });
      if (res?.error) {
        setError(mapAuthError(res.error));
        setLoading(false);
        return;
      }
      if (!res?.ok) {
        setError("Нэвтрэлт амжилтгүй боллоо. Дахин оролдоно уу.");
        setLoading(false);
        return;
      }

      const session = await waitForSession(15, 200);
      if (!session?.user) {
        await signIn("credentials", {
          email: em,
          password: pw,
          callbackUrl: getSafeCallbackUrl(callbackUrl),
          redirect: true,
        });
        return;
      }

      window.location.href = getSafeCallbackUrl(callbackUrl, session.user.role);
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="auth-alert auth-alert--error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">
            И-мэйл
          </label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@school.edu.mn"
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">
            Нууц үг
          </label>
          <div className="auth-input-wrap">
            <input
              id="login-password"
              type={showPass ? "text" : "password"}
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
              tabIndex={-1}
            >
              <Ic n={showPass ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
        </div>

        <div className="auth-row-between">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Намайг санах
          </label>
          <Link href="/forgot-password" className="auth-link">
            Нууц үг мартсан?
          </Link>
        </div>

        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
        </button>
      </form>

      <p className="auth-footer-text">
        Бүртгэл байхгүй юу?{" "}
        <button type="button" className="auth-btn-text" onClick={onSwitch}>
          Бүртгүүлэх
        </button>
      </p>
    </>
  );
}

/* ════════════════════════════════════════════
   REGISTER FORM
════════════════════════════════════════════ */
function RegisterTab({ onSwitch }: { onSwitch: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    province: "",
    school: "",
    grade: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  function upd(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        grade: form.grade === "" ? undefined : Number(form.grade),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
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
        <div className="auth-alert auth-alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="auth-alert auth-alert--success" role="status">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-register-grid">
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-lastname">
              Овог
            </label>
            <input
              id="reg-lastname"
              className="auth-input"
              value={form.lastName}
              onChange={(e) => upd("lastName", e.target.value)}
              placeholder="Дорж"
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-firstname">
              Нэр
            </label>
            <input
              id="reg-firstname"
              className="auth-input"
              value={form.firstName}
              onChange={(e) => upd("firstName", e.target.value)}
              placeholder="Болд"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-email">
            И-мэйл
          </label>
          <input
            id="reg-email"
            type="email"
            className="auth-input"
            value={form.email}
            onChange={(e) => upd("email", e.target.value)}
            placeholder="name@school.edu.mn"
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password">
            Нууц үг
          </label>
          <div className="auth-input-wrap">
            <input
              id="reg-password"
              type={showPass ? "text" : "password"}
              className="auth-input"
              value={form.password}
              onChange={(e) => upd("password", e.target.value)}
              placeholder="•••••• (6+ тэмдэгт)"
              required
              minLength={6}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
              tabIndex={-1}
            >
              <Ic n={showPass ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
        </div>

        <div className="auth-register-grid">
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-phone">
              Утас
            </label>
            <input
              id="reg-phone"
              className="auth-input"
              value={form.phone}
              onChange={(e) => upd("phone", e.target.value)}
              placeholder="9900XXXX"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-province">
              Аймаг / нийслэл
            </label>
            <select
              id="reg-province"
              className="auth-select"
              value={form.province}
              onChange={(e) => upd("province", e.target.value)}
            >
              <option value="">Сонгох</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-school">
            Сургууль
          </label>
          <input
            id="reg-school"
            className="auth-input"
            value={form.school}
            onChange={(e) => upd("school", e.target.value)}
            placeholder="Сургуулийн нэр"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-grade">
            Анги
          </label>
          <select
            id="reg-grade"
            className="auth-select"
            value={form.grade}
            onChange={(e) => upd("grade", e.target.value)}
            required
          >
            <option value="">Сонгох</option>
            {SCHOOL_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}-р анги
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? "Бүртгэж байна…" : "Бүртгүүлэх"}
        </button>
      </form>

      <p className="auth-footer-text">
        Бүртгэлтэй юу?{" "}
        <button type="button" className="auth-btn-text" onClick={onSwitch}>
          Нэвтрэх
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
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,210,63,0.15) 0%, rgba(94,206,186,0.06) 50%, transparent 70%)",
            top: "30%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />

        {/* Left scattered shapes */}
        {[
          {
            x: 10,
            y: 10,
            size: 70,
            color: "rgba(94,206,186,0.08)",
            type: "circle",
          },
          {
            x: 85,
            y: 80,
            size: 50,
            color: "rgba(94,206,186,0.08)",
            type: "circle",
          },
          {
            x: 15,
            y: 75,
            size: 40,
            color: "rgba(94,206,186,0.12)",
            type: "rect",
            rot: 15,
          },
          {
            x: 80,
            y: 15,
            size: 35,
            color: "rgba(56,189,160,0.15)",
            type: "triangle",
            rot: -10,
          },
        ].map((sh, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${sh.x}%`,
              top: `${sh.y}%`,
              transform: `translate(-50%,-50%) rotate(${sh.rot ?? 0}deg)`,
              pointerEvents: "none",
            }}
          >
            {sh.type === "circle" && (
              <div
                style={{
                  width: sh.size,
                  height: sh.size,
                  borderRadius: "50%",
                  background: sh.color,
                }}
              />
            )}
            {sh.type === "rect" && (
              <div
                style={{
                  width: sh.size,
                  height: sh.size,
                  borderRadius: 6,
                  background: "transparent",
                  border: `2.5px solid ${sh.color}`,
                }}
              />
            )}
            {sh.type === "triangle" && (
              <svg width={sh.size} height={sh.size} viewBox="0 0 60 60">
                <polygon
                  points="30,4 56,56 4,56"
                  fill="transparent"
                  stroke={sh.color}
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
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
          <p>Физикийг тоглоомоор сур.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-panel-right">
        {/* Background shapes */}
        {BG_SHAPES.map((sh, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${sh.x}%`,
              top: `${sh.y}%`,
              transform: `translate(-50%,-50%) rotate(${sh.rot ?? 0}deg)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {sh.type === "circle" && (
              <div
                style={{
                  width: sh.size,
                  height: sh.size,
                  borderRadius: "50%",
                  background: sh.color,
                }}
              />
            )}
            {sh.type === "rect" && (
              <div
                style={{
                  width: sh.size,
                  height: sh.size,
                  borderRadius: 8,
                  background: "transparent",
                  border: `3px solid ${sh.color}`,
                }}
              />
            )}
            {sh.type === "triangle" && (
              <svg width={sh.size} height={sh.size} viewBox="0 0 60 60">
                <polygon
                  points="30,4 56,56 4,56"
                  fill="transparent"
                  stroke={sh.color}
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {sh.type === "star" && <StarSvg size={sh.size} color={sh.color} />}
          </div>
        ))}

        <div className="auth-form-card">
          <div className="auth-tabs">
            {(["login", "register"] as const).map((t) => (
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

          <p className="auth-tab-desc">
            {tab === "login"
              ? "CyberPhysics бүртгэлээрээ нэвтэрнэ үү."
              : "Сурагчийн мэдээллээ оруулж бүртгүүлнэ үү."}
          </p>

          {authError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {mapAuthError(authError)}
            </div>
          )}

          {tab === "login" ? (
            <LoginTab
              onSwitch={() => setTab("register")}
              callbackUrl={callbackUrl}
            />
          ) : (
            <RegisterTab onSwitch={() => setTab("login")} />
          )}
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
    <Suspense fallback={<Loading fullScreen background="#0D0D15" size={120} />}>
      <AuthContent />
    </Suspense>
  );
}
