// src/app/admin/page.tsx
"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { LiveGameControl } from "@/components/admin/LiveGameControl";
import { ConnectedStudents } from "@/components/admin/ConnectedStudents";
import { LiveLeaderboard } from "@/components/admin/LiveLeaderboard";
import { AnalyticsCards } from "@/components/admin/AnalyticsCards";

type Tab = "overview" | "users" | "questions" | "categories" | "payments" | "live";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  todayActive: number;
  totalRevenue: number;
  newUsersLast7: number;
  byProvince: { _id: string; count: number }[];
  recentPayments: any[];
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isPremium: boolean;
  xp: number;
  coins: number;
  streak: number;
  createdAt: string;
}

interface Question {
  _id: string;
  question: string;
  difficulty: string;
  level: number;
  xpReward: number;
  categoryId: { name: string; icon: string };
}

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  totalLevels: number;
  isActive: boolean;
  order: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab]       = useState<Tab>("overview");
  const [stats, setStats]   = useState<Stats | null>(null);
  const [users, setUsers]   = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Question form state
  const [qForm, setQForm] = useState({
    categoryId: "", level: 1, question: "", options: ["", "", "", ""],
    correctIndex: 0, explanation: "", difficulty: "medium", xpReward: 10, coinReward: 5,
  });
  const [qModal, setQModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", icon: "⚡", color: "#FFD23F", totalLevels: 5, order: 0 });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/dashboard");
  }, [status, session, router]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?search=${search}`);
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
    setLoading(false);
  }, [search]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/questions");
    if (res.ok) { const d = await res.json(); setQuestions(d.questions); }
    setLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) { const d = await res.json(); setCategories(d.categories); }
  }, []);

  useEffect(() => {
    if (tab === "overview") loadStats();
    if (tab === "users") loadUsers();
    if (tab === "questions") { loadQuestions(); loadCategories(); }
    if (tab === "categories") loadCategories();
  }, [tab, loadStats, loadUsers, loadQuestions, loadCategories]);

  async function togglePremium(userId: string, isPremium: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, updates: {
          isPremium: !isPremium,
          premiumUntil: !isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        },
      }),
    });
    loadUsers();
  }

  async function submitQuestion() {
    const res = await fetch("/api/admin/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qForm),
    });
    if (res.ok) { setQModal(false); loadQuestions(); }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Устгах уу?")) return;
    await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
    loadQuestions();
  }

  async function submitCategory() {
    const res = await fetch("/api/admin/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    if (res.ok) { setCatModal(false); loadCategories(); }
  }

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#07070D", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
      Ачаалж байна...
    </div>
  );

  const S = {
    container: { minHeight: "100vh", background: "#07070D", fontFamily: "Plus Jakarta Sans, sans-serif", color: "#E2E8F0" } as React.CSSProperties,
    sidebar: {
      position: "fixed" as const, left: 0, top: 0, bottom: 0, width: 220,
      background: "#13131F", borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column" as const, padding: "20px 0",
    },
    main: { marginLeft: 220, padding: "32px 36px", minHeight: "100vh" } as React.CSSProperties,
    card: {
      background: "#13131F", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)",
      padding: "20px 24px",
    } as React.CSSProperties,
    btn: (active = false) => ({
      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
      margin: "2px 12px", borderRadius: 10, border: "none", cursor: "pointer",
      background: active ? "rgba(255,210,63,0.12)" : "transparent",
      color: active ? "#FFD23F" : "#64748B", fontWeight: active ? 700 : 500,
      fontSize: 14, width: "calc(100% - 24px)", textAlign: "left" as const,
      transition: "all 0.2s",
    }),
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { padding: "12px 14px", textAlign: "left" as const, fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    td: { padding: "12px 14px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  };

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: "overview",   icon: "📊", label: "Тойм" },
    { id: "live",       icon: "🎮", label: "Шууд тоглолт" },
    { id: "users",      icon: "👥", label: "Хэрэглэгчид" },
    { id: "questions",  icon: "❓", label: "Асуултууд" },
    { id: "categories", icon: "📚", label: "Сэдвүүд" },
    { id: "payments",   icon: "💳", label: "Төлбөр" },
  ];

  return (
    <div style={S.container}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ padding: "0 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
          <div style={{ fontWeight: 900, fontSize: 15, color: "#E2E8F0" }}>CyberPhysics</div>
          <div style={{ fontSize: 11, color: "#FFD23F", fontWeight: 700 }}>ADMIN PANEL</div>
        </div>

        {navItems.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={S.btn(tab === item.id)}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
          <div style={{ padding: "10px 16px", fontSize: 13, color: "#64748B" }}>
            <div style={{ fontWeight: 700, color: "#94A3B8" }}>{session?.user?.name}</div>
            <div style={{ fontSize: 11 }}>{session?.user?.email}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
            ...S.btn(), color: "#EF4444", width: "100%",
          }}>
            🚪 Гарах
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={S.main}>
        {/* ── LIVE GAME ────────────────────────────────── */}
        {tab === "live" && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, color: "#E2E8F0" }}>🎮 Шууд тоглолт</h1>
            <p style={{ color: "#64748B", marginBottom: 28 }}>Сурагчидтай шууд тоглолт явуулах, хянах</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
              <LiveGameControl />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <LiveLeaderboard live />
                <ConnectedStudents sessionActive />
              </div>
            </div>
          </div>
        )}

        {/* ── OVERVIEW ─────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Тойм</h1>
            <p style={{ color: "#64748B", marginBottom: 28 }}>CyberPhysics платформын өнөөдрийн байдал</p>

            {stats ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Нийт хэрэглэгч", value: stats.totalUsers, icon: "👥", color: "#5ECEBA" },
                    { label: "Premium", value: stats.premiumUsers, icon: "⭐", color: "#FFD23F" },
                    { label: "Өнөөдөр идэвхтэй", value: stats.todayActive, icon: "🔥", color: "#FB923C" },
                    { label: "Нийт орлого", value: `${stats.totalRevenue.toLocaleString()}₮`, icon: "💰", color: "#A78BFA" },
                  ].map(stat => (
                    <div key={stat.label} style={S.card}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={S.card}>
                    <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Аймгаар</h3>
                    {stats.byProvince.map(p => (
                      <div key={p._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: "#94A3B8" }}>{p._id || "Тодорхойгүй"}</span>
                        <span style={{ fontWeight: 700, color: "#FFD23F" }}>{p.count}</span>
                      </div>
                    ))}
                  </div>

                  <div style={S.card}>
                    <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Сүүлийн төлбөрүүд</h3>
                    {stats.recentPayments.length === 0 && (
                      <p style={{ color: "#475569", fontSize: 14 }}>Одоогоор байхгүй</p>
                    )}
                    {stats.recentPayments.map((p: any) => (
                      <div key={p._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.userId?.firstName} {p.userId?.lastName}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{p.type}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: "#5ECEBA" }}>{p.amount.toLocaleString()}₮</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: "#64748B" }}>Ачаалж байна...</div>
            )}
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900 }}>Хэрэглэгчид</h1>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadUsers()}
                placeholder="Хайх... (Enter)"
                style={{
                  padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)", color: "#E2E8F0", fontSize: 14, width: 240, outline: "none",
                }}
              />
            </div>

            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    <th style={S.th}>Нэр</th>
                    <th style={S.th}>И-мэйл</th>
                    <th style={S.th}>Дүр</th>
                    <th style={S.th}>XP</th>
                    <th style={S.th}>Streak</th>
                    <th style={S.th}>Premium</th>
                    <th style={S.th}>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#64748B" }}>Ачаалж байна...</td></tr>
                  ) : users.map(u => (
                    <tr key={u._id} style={{ transition: "background 0.1s" }}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 700 }}>{u.lastName} {u.firstName}</div>
                      </td>
                      <td style={{ ...S.td, color: "#64748B", fontSize: 13 }}>{u.email}</td>
                      <td style={S.td}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: u.role === "admin" ? "rgba(167,139,250,0.15)" : u.role === "teacher" ? "rgba(94,206,186,0.15)" : "rgba(255,255,255,0.06)",
                          color: u.role === "admin" ? "#A78BFA" : u.role === "teacher" ? "#5ECEBA" : "#94A3B8",
                        }}>
                          {u.role === "admin" ? "Admin" : u.role === "teacher" ? "Багш" : "Сурагч"}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: "#FFD23F", fontWeight: 700 }}>{u.xp}</td>
                      <td style={{ ...S.td, color: "#FB923C" }}>{u.streak}🔥</td>
                      <td style={S.td}>
                        <button onClick={() => togglePremium(u._id, u.isPremium)} style={{
                          padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                          background: u.isPremium ? "rgba(255,210,63,0.15)" : "rgba(255,255,255,0.06)",
                          color: u.isPremium ? "#FFD23F" : "#64748B",
                        }}>
                          {u.isPremium ? "⭐ Premium" : "Энгийн"}
                        </button>
                      </td>
                      <td style={S.td}>
                        <button onClick={() => {/* view detail */}} style={{
                          padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                          background: "transparent", color: "#94A3B8", cursor: "pointer", fontSize: 12,
                        }}>Дэлгэрэнгүй</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── QUESTIONS ─────────────────────────────────── */}
        {tab === "questions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900 }}>Асуултууд</h1>
              <button onClick={() => setQModal(true)} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: "#FFD23F", color: "#07070D", fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}>
                + Асуулт нэмэх
              </button>
            </div>

            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    <th style={S.th}>Асуулт</th>
                    <th style={S.th}>Сэдэв</th>
                    <th style={S.th}>Level</th>
                    <th style={S.th}>Хүнд</th>
                    <th style={S.th}>XP</th>
                    <th style={S.th}>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#64748B" }}>Ачаалж байна...</td></tr>
                  ) : questions.map(q => (
                    <tr key={q._id}>
                      <td style={{ ...S.td, maxWidth: 300 }}>
                        <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {q.question}
                        </div>
                      </td>
                      <td style={S.td}>
                        {q.categoryId ? `${q.categoryId.icon} ${q.categoryId.name}` : "—"}
                      </td>
                      <td style={S.td}>{q.level}</td>
                      <td style={S.td}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: q.difficulty === "hard" ? "rgba(239,68,68,0.15)" : q.difficulty === "medium" ? "rgba(251,146,60,0.15)" : "rgba(94,206,186,0.15)",
                          color: q.difficulty === "hard" ? "#EF4444" : q.difficulty === "medium" ? "#FB923C" : "#5ECEBA",
                        }}>
                          {q.difficulty === "hard" ? "Хэцүү" : q.difficulty === "medium" ? "Дунд" : "Хялбар"}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: "#FFD23F", fontWeight: 700 }}>+{q.xpReward}</td>
                      <td style={S.td}>
                        <button onClick={() => deleteQuestion(q._id)} style={{
                          padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)", color: "#EF4444", cursor: "pointer", fontSize: 12,
                        }}>Устгах</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CATEGORIES ─────────────────────────────────── */}
        {tab === "categories" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900 }}>Сэдвүүд</h1>
              <button onClick={() => setCatModal(true)} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: "#FFD23F", color: "#07070D", fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}>
                + Сэдэв нэмэх
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {categories.map(cat => (
                <div key={cat._id} style={{ ...S.card, borderLeft: `3px solid ${cat.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
                    <span style={{
                      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: cat.isActive ? "rgba(94,206,186,0.15)" : "rgba(255,255,255,0.06)",
                      color: cat.isActive ? "#5ECEBA" : "#64748B",
                    }}>
                      {cat.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>{cat.totalLevels} level</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAYMENTS ─────────────────────────────────── */}
        {tab === "payments" && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24 }}>Төлбөрийн түүх</h1>
            <div style={{ ...S.card, padding: "20px", textAlign: "center", color: "#64748B" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <p>QPay болон Khan Bank интеграцийг тохируулсны дараа энд харагдана.</p>
            </div>
          </div>
        )}
      </main>

      {/* ── Question Modal ─────────────────────────────── */}
      {qModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#13131F", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
          }}>
            <h2 style={{ marginBottom: 20, fontWeight: 900 }}>Асуулт нэмэх</h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Сэдэв</label>
              <select value={qForm.categoryId} onChange={e => setQForm({...qForm, categoryId: e.target.value})}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14 }}>
                <option value="">-- Сонгоно уу --</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Level</label>
                <input type="number" min="1" value={qForm.level} onChange={e => setQForm({...qForm, level: +e.target.value})}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Хүндвэр</label>
                <select value={qForm.difficulty} onChange={e => setQForm({...qForm, difficulty: e.target.value})}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14 }}>
                  <option value="easy">Хялбар</option>
                  <option value="medium">Дунд</option>
                  <option value="hard">Хэцүү</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Асуулт</label>
              <textarea value={qForm.question} onChange={e => setQForm({...qForm, question: e.target.value})} rows={3}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14, resize: "vertical" }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Хариултууд (зөв хариултыг дугуйлна уу)</label>
              {qForm.options.map((opt, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input type="radio" name="correct" checked={qForm.correctIndex === i}
                    onChange={() => setQForm({...qForm, correctIndex: i})}
                    style={{ accentColor: "#FFD23F" }} />
                  <input value={opt} onChange={e => {
                    const opts = [...qForm.options]; opts[i] = e.target.value;
                    setQForm({...qForm, options: opts});
                  }}
                    placeholder={`Хариулт ${i + 1}`}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${qForm.correctIndex === i ? "rgba(255,210,63,0.4)" : "rgba(255,255,255,0.1)"}`, background: "#1A1A2E", color: "#E2E8F0", fontSize: 13 }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Тайлбар</label>
              <textarea value={qForm.explanation} onChange={e => setQForm({...qForm, explanation: e.target.value})} rows={2}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setQModal(false)} style={{
                flex: 1, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#94A3B8", cursor: "pointer", fontWeight: 700,
              }}>Болих</button>
              <button onClick={submitQuestion} style={{
                flex: 1, padding: 12, borderRadius: 10, border: "none",
                background: "#FFD23F", color: "#07070D", fontWeight: 800, cursor: "pointer",
              }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Modal ─────────────────────────────── */}
      {catModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#13131F", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
            padding: "32px", width: "100%", maxWidth: 420,
          }}>
            <h2 style={{ marginBottom: 20, fontWeight: 900 }}>Сэдэв нэмэх</h2>
            {[
              { label: "Нэр (монгол)", key: "name", placeholder: "Цахилгаан" },
              { label: "Emoji дүрс", key: "icon", placeholder: "⚡" },
              { label: "Өнгө (hex)", key: "color", placeholder: "#FFD23F" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={(catForm as any)[f.key]} onChange={e => setCatForm({...catForm, [f.key]: e.target.value})}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14 }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 6 }}>Нийт level тоо</label>
              <input type="number" min="1" value={catForm.totalLevels} onChange={e => setCatForm({...catForm, totalLevels: +e.target.value})}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#1A1A2E", color: "#E2E8F0", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCatModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94A3B8", cursor: "pointer", fontWeight: 700 }}>Болих</button>
              <button onClick={submitCategory} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#FFD23F", color: "#07070D", fontWeight: 800, cursor: "pointer" }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
