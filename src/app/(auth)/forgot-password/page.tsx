// src/app/(auth)/forgot-password/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");

    const res  = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error);
    else setMessage(data.message);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#07070D",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Plus Jakarta Sans, sans-serif", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "#13131F",
        borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: "40px 32px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", margin: "0 auto 14px", fontSize: 14, fontWeight: 800, color: "#93C5FD", letterSpacing: "0.04em" }}>CP</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", marginBottom: 8 }}>
            Нууц үг сэргээх
          </h1>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            И-мэйл хаягаа оруулна уу. Сэргээх холбоос илгээнэ.
          </p>
        </div>

        {message ? (
          <div style={{
            background: "rgba(94,206,186,0.1)", border: "1px solid rgba(94,206,186,0.3)",
            borderRadius: 12, padding: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📬</div>
            <p style={{ color: "#5ECEBA", fontWeight: 700, marginBottom: 4 }}>{message}</p>
            <p style={{ color: "#64748B", fontSize: 13 }}>Имэйлээ шалгана уу</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 16, color: "#FCA5A5", fontSize: 14,
              }}>⚠️ {error}</div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>
                И-мэйл хаяг
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com" required
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)", color: "#E2E8F0",
                  fontSize: 14, outline: "none",
                }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: 13, borderRadius: 12, border: "none",
              background: loading ? "rgba(255,210,63,0.5)" : "#FFD23F",
              color: "#07070D", fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}>
              {loading ? "Илгээж байна..." : "Холбоос илгээх"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
          <Link href="/login" style={{ color: "#64748B", textDecoration: "none" }}>
            ← Нэвтрэх хуудас руу буцах
          </Link>
        </p>
      </div>
    </div>
  );
}
