"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import "./admin.css";
import { ContentManager } from "@/components/admin/ContentManager";
import { VideoLessonManager } from "@/components/admin/VideoLessonManager";
import { SeedPhysicsPanel } from "@/components/admin/SeedPhysicsPanel";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcon";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/confirm-dialog";

// ── Types ─────────────────────────────────────────────────────
type Tab = "overview" | "content" | "live" | "users" | "exams" | "videos";

interface Stats {
  totalUsers: number; premiumUsers: number; todayActive: number;
  totalRevenue: number; newUsersLast7: number;
  byProvince: { _id: string; count: number }[];
  recentPayments: PayRow[];
}
interface User {
  _id: string; firstName: string; lastName: string; email: string;
  role: string; isPremium: boolean; xp: number; coins: number; streak: number; createdAt: string;
}
interface PayRow {
  _id: string; userId: { firstName?: string; lastName?: string; email?: string } | string;
  amount: number; type: string; status: string; method: string; createdAt: string;
}
interface ExamOption { id: string; text: string; }
interface ExamQuestion { id: string; question: string; options: ExamOption[]; correctAnswer: string; }
interface ExamItem { _id: string; title: string; description?: string; duration: number; questions: ExamQuestion[]; createdAt: string; }
interface AttemptRow { _id: string; studentId?: { firstName?: string; lastName?: string; email?: string }; score: number; totalQuestions: number; percentage?: number; finishedAt?: string; }
interface LbEntry { name: string; initials: string; score: number; streak: number; }

// ── Defaults ──────────────────────────────────────────────────
const EMPTY_EXAM = { title: "", description: "", duration: 60, questions: [{ id: "1", question: "", options: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }], correctAnswer: "A" }] };
const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" }); }
function initials2(a?: string, b?: string) { return `${a?.[0] ?? ""}${b?.[0] ?? ""}`.toUpperCase() || "?"; }
function nameFromEntry(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0] ?? ""}${p[1][0] ?? ""}`.toUpperCase();
  return (p[0] ?? "?").slice(0, 2).toUpperCase();
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [contentKey, setContentKey] = useState(0);
  const toastApi = useToast();
  const { confirm } = useConfirm();
  function toast(msg: string, type: "ok" | "err" = "ok") {
    if (type === "err") toastApi.error(msg);
    else toastApi.success(msg);
  }

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [lbPlayers, setLbPlayers] = useState<LbEntry[]>([]);
  const [examAttempts, setExamAttempts] = useState<AttemptRow[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);

  // UI
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [examSearch, setExamSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());

  // Modals
  const [examModal, setExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ ...EMPTY_EXAM });
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/admin");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/dashboard");
  }, [status, session, router]);

  // ── Loaders ──────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/stats");
      if (r.ok) setStats(await r.json());
    } catch { /* silent */ }
  }, []);

  const loadUsers = useCallback(async (page = 1, role = "all", q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (role !== "all") params.set("role", role);
      if (q) params.set("search", q);
      const r = await fetch(`/api/admin/users?${params}`);
      if (r.ok) {
        const d = await r.json();
        setUsers(d.users ?? []);
        setUserTotal(d.total ?? 0);
        setUserPage(page);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/exam/exams");
      if (r.ok) { const d = await r.json(); setExams(Array.isArray(d) ? d : []); }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const r = await fetch("/api/leaderboard");
      if (!r.ok) return;
      const d = await r.json();
      const entries = Array.isArray(d.entries) ? d.entries : [];
      setLbPlayers(entries.slice(0, 20).map((e: { name: string; xp?: number; streak?: number }) => ({
        name: e.name || "Сурагч",
        initials: nameFromEntry(e.name || "S"),
        score: e.xp ?? 0,
        streak: e.streak ?? 0,
      })));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;
    if (tab === "overview") loadStats();
    if (tab === "users") loadUsers(1, userRoleFilter, userSearch);
    if (tab === "exams") loadExams();
    if (tab === "live") loadLeaderboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (status === "loading") {
    return <Loading fullScreen background="#f8fafc" message="Уншиж байна…" />;
  }
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return null;
  }

  // ── Exam CRUD ─────────────────────────────────────────────────
  async function saveExam() {
    if (!examForm.title.trim()) { toast("Шалгалтын нэр оруулна уу", "err"); return; }
    setSubmitting(true);
    try {
      if (editingExam) {
        const r = await fetch(`/api/exam/exams/${editingExam._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(examForm) });
        if (!r.ok) throw new Error();
        toast("Шалгалт шинэчлэгдлээ");
      } else {
        const r = await fetch("/api/exam/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(examForm) });
        if (!r.ok) throw new Error();
        toast("Шалгалт нэмэгдлээ");
      }
      closeExamModal();
      loadExams();
    } catch {
      toast("Хадгалах үед алдаа гарлаа", "err");
    }
    setSubmitting(false);
  }

  async function deleteExam(id: string) {
    const ok = await confirm({
      title: "Шалгалт устгах",
      description: "Шалгалтыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.",
      confirmLabel: "Устгах",
      destructive: true,
    });
    if (!ok) return;
    try {
      const r = await fetch(`/api/exam/exams/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast("Шалгалт устгагдлаа");
      loadExams();
      if (selectedExam?._id === id) { setSelectedExam(null); setExamAttempts([]); }
    } catch {
      toast("Устгах үед алдаа гарлаа", "err");
    }
  }

  function openEditExam(exam: ExamItem) {
    setEditingExam(exam);
    setExamForm({ title: exam.title, description: exam.description ?? "", duration: exam.duration, questions: exam.questions?.length ? exam.questions : EMPTY_EXAM.questions });
    setExamModal(true);
  }

  function closeExamModal() {
    setExamModal(false); setEditingExam(null); setExamForm({ ...EMPTY_EXAM });
  }

  async function loadAttempts(examId: string) {
    try {
      const r = await fetch(`/api/exam/attempts/exam/${examId}`);
      if (r.ok) setExamAttempts(await r.json());
    } catch { setExamAttempts([]); }
  }

  // Exam form helpers
  function addExamQuestion() {
    setExamForm(f => ({ ...f, questions: [...f.questions, { id: uid(), question: "", options: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }], correctAnswer: "A" }] }));
  }
  function removeExamQuestion(qid: string) {
    setExamForm(f => ({ ...f, questions: f.questions.filter(q => q.id !== qid) }));
  }
  function updateExamQ(qid: string, field: string, val: string) {
    setExamForm(f => ({ ...f, questions: f.questions.map(q => q.id === qid ? { ...q, [field]: val } : q) }));
  }
  function updateExamOpt(qid: string, oid: string, text: string) {
    setExamForm(f => ({ ...f, questions: f.questions.map(q => q.id === qid ? { ...q, options: q.options.map(o => o.id === oid ? { ...o, text } : o) } : q) }));
  }

  // ── User actions ──────────────────────────────────────────────
  async function togglePremium(id: string, current: boolean) {
    if (togglingUsers.has(id)) return;
    setTogglingUsers(prev => new Set([...prev, id]));
    try {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, updates: { isPremium: !current } }),
      });
      if (!r.ok) throw new Error();
      toast(!current ? "Premium эрх нэмэгдлээ" : "Premium эрх авагдлаа");
      loadUsers(userPage, userRoleFilter, userSearch);
    } catch {
      toast("Алдаа гарлаа", "err");
    }
    setTogglingUsers(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function changeRole(id: string, role: string) {
    try {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, updates: { role } }),
      });
      if (!r.ok) throw new Error();
      toast("Дүр өөрчлөгдлөө");
      loadUsers(userPage, userRoleFilter, userSearch);
    } catch {
      toast("Алдаа гарлаа", "err");
    }
  }

  async function deleteUser(id: string) {
    const ok = await confirm({
      title: "Хэрэглэгч устгах",
      description: "Хэрэглэгчийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.",
      confirmLabel: "Устгах",
      destructive: true,
    });
    if (!ok) return;
    try {
      const r = await fetch(`/api/admin/users?userId=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast("Хэрэглэгч устгагдлаа");
      loadUsers(userPage, userRoleFilter, userSearch);
    } catch {
      toast("Устгах үед алдаа гарлаа", "err");
    }
  }

  // ── Filtered data ─────────────────────────────────────────────
  const filteredExams = exams.filter(e =>
    !examSearch || e.title.toLowerCase().includes(examSearch.toLowerCase())
  );

  const NAV_GROUPS: { label: string; items: { id: Tab; label: string; icon: AdminIconName }[] }[] = [
    {
      label: "Ерөнхий",
      items: [{ id: "overview", label: "Тойм", icon: "chart" }],
    },
    {
      label: "Хичээл & тоглоом",
      items: [
        { id: "content", label: "Physic map", icon: "layers" },
        { id: "videos", label: "Видео & PDF", icon: "video" },
        { id: "exams", label: "Шалгалт", icon: "clipboard" },
      ],
    },
    {
      label: "Хэрэглэгчид",
      items: [
        { id: "users", label: "Бүртгэл", icon: "users" },
        { id: "live", label: "Тэргүүлэгчид", icon: "trophy" },
      ],
    },
  ];

  return (
    <div className="admin-root">
      <div className="shell">
        {/* ── SIDEBAR ─────────────────────────────────── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-title">CyberPhysics</div>
            <div className="brand-sub">Удирдлагын самбар</div>
          </div>
          <nav className="nav">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="nav-section">
                <div className="nav-section-label">{group.label}</div>
                {group.items.map((n) => (
                  <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                    <span className="nav-icon"><AdminIcon name={n.icon} size={15} /></span>
                    {n.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="user-area">
            <div className="avatar">{(session?.user?.name ?? "A")[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.name ?? "Admin"}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</div>
            </div>
            <button className="signout-btn" onClick={() => signOut({ callbackUrl: "/login" })}>Гарах</button>
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────── */}
        <main className="main">

          {/* ═══ OVERVIEW ══════════════════════════════ */}
          {tab === "overview" && (
            <div>
              <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h1 className="page-title">Ерөнхий тойм</h1>
                  <p className="page-sub">{new Date().toLocaleDateString("mn-MN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <button className="btn" onClick={loadStats}>Шинэчлэх</button>
              </div>

              <div className="quick-cards">
                <button type="button" className="quick-card" onClick={() => setTab("content")}>
                  <strong className="quick-card-title"><AdminIcon name="layers" size={16} /> Physic map</strong>
                  <span>Сэдэв, хичээл, асуулт нэмэх — сурагчийн газрын зураг</span>
                </button>
                <button type="button" className="quick-card" onClick={() => setTab("videos")}>
                  <strong className="quick-card-title"><AdminIcon name="video" size={16} /> Видео & PDF</strong>
                  <span>Бичлэг, баримт бичиг байршуулах</span>
                </button>
                <button type="button" className="quick-card" onClick={() => setTab("exams")}>
                  <strong className="quick-card-title"><AdminIcon name="clipboard" size={16} /> Шалгалт</strong>
                  <span>Шалгалт үүсгэх, үр дүн харах</span>
                </button>
                <button type="button" className="quick-card" onClick={() => setTab("users")}>
                  <strong className="quick-card-title"><AdminIcon name="users" size={16} /> Хэрэглэгчид</strong>
                  <span>Бүртгэл, дүр, premium удирдах</span>
                </button>
              </div>

              {!stats ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                  <Loading size={88} message="Ачаалж байна…" />
                </div>
              ) : (
                <>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-label">Нийт хэрэглэгч</div>
                      <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                      <div className="stat-trend up">+{stats.newUsersLast7} энэ 7 хоногт</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Premium хэрэглэгч</div>
                      <div className="stat-value">{stats.premiumUsers.toLocaleString()}</div>
                      <div className="stat-trend">{Math.round(stats.premiumUsers / Math.max(stats.totalUsers, 1) * 100)}% нийтээс</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Өнөөдөр идэвхтэй</div>
                      <div className="stat-value">{stats.todayActive.toLocaleString()}</div>
                      <div className="stat-trend">Өдрийн идэвх</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Нийт орлого</div>
                      <div className="stat-value">{(stats.totalRevenue / 1_000_000).toFixed(2)}M₮</div>
                      <div className="stat-trend">Бүх цагийн дүн</div>
                    </div>
                  </div>

                  {(stats.recentPayments?.length ?? 0) > 0 && (
                    <div className="card">
                      <div className="card-head"><div><h3>Сүүлийн төлбөрүүд</h3><div className="sub">QPay болон Khan Bank гүйлгээ</div></div></div>
                      <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
                        <table className="table">
                          <thead><tr><th>Хэрэглэгч</th><th>Арга</th><th>Огноо</th><th style={{ textAlign: "right" }}>Дүн</th><th>Статус</th></tr></thead>
                          <tbody>
                            {stats.recentPayments.slice(0, 8).map((p, i) => (
                              <tr key={p._id ?? i}>
                                <td style={{ fontWeight: 500 }}>
                                  {typeof p.userId === "object" ? `${p.userId?.firstName ?? ""} ${p.userId?.lastName ?? ""}`.trim() || p.userId?.email || "—" : "Хэрэглэгч"}
                                </td>
                                <td><span className={`badge ${p.method === "qpay" ? "blue" : "amber"}`}>{p.method?.toUpperCase()}</span></td>
                                <td style={{ color: "#94A3B8", fontSize: 12 }}>{fmtDate(p.createdAt)}</td>
                                <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{(p.amount ?? 0).toLocaleString()}₮</td>
                                <td>
                                  <span className={`badge ${p.status === "success" ? "green" : p.status === "pending" ? "amber" : "red"}`}>
                                    {p.status === "success" ? "Амжилттай" : p.status === "pending" ? "Хүлээгдэж" : "Алдаа"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ GAME CONTENT ═══════════════════════════ */}
          {tab === "content" && (
            <div className="physic-map-page">
              <div className="page-header physic-map-header">
                <div>
                  <p className="physic-map-eyebrow">Physics LMS</p>
                  <h1 className="page-title">Physic map</h1>
                  <p className="page-sub">Сэдэв → хичээл → агуулга — сурагчийн тоглоомын газрын зураг</p>
                </div>
              </div>
              <div className="help-banner help-banner--physics">
                <div className="help-banner-icon"><AdminIcon name="atom" size={20} strokeWidth={1.5} /></div>
                <div>
                  <h3>Багшийн ажлын дараалал</h3>
                  <p>
                    <strong>1. Сэдэв</strong> (жишээ: Механик) → <strong>2. Хичээл</strong> (нэг түвшин) →{" "}
                    <strong>3. Агуулга</strong> (текст + хамгийн багадаа 1 асуулт). Дараа нь{" "}
                    <strong>Хадгалах</strong>.
                  </p>
                </div>
              </div>
              <SeedPhysicsPanel onSeeded={() => setContentKey((k) => k + 1)} />
              <ContentManager key={contentKey} />
            </div>
          )}

          {/* ═══ LEADERBOARD ════════════════════════════ */}
          {tab === "live" && (
            <div>
              <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h1 className="page-title">Тэргүүлэгчид</h1>
                  <p className="page-sub">XP-ээр эрэмбэлэгдсэн шилдэг сурагчид</p>
                </div>
                <button className="btn" onClick={loadLeaderboard}>Шинэчлэх</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th style={{ width: 50 }}>#</th><th>Сурагч</th><th style={{ width: 140 }}>XP</th><th style={{ width: 140 }}>Streak</th></tr></thead>
                  <tbody>
                    {lbPlayers.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Мэдээлэл байхгүй байна</td></tr>
                    ) : lbPlayers.map((p, i) => (
                      <tr key={`${p.name}-${i}`}>
                        <td style={{ fontWeight: i < 3 ? 700 : 400, color: i === 0 ? "#F59E0B" : i === 1 ? "#94A3B8" : i === 2 ? "#B45309" : "#94A3B8" }}>
                          {i + 1}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar">{p.initials}</div>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                          </div>
                        </td>
                        <td className="text-brand" style={{ fontVariantNumeric: "tabular-nums" }}>{p.score.toLocaleString()} XP</td>
                        <td style={{ color: p.streak > 7 ? "#F59E0B" : "#64748B" }}>{p.streak > 0 ? `${p.streak} өдөр streak` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pager">{lbPlayers.length} сурагч</div>
              </div>
            </div>
          )}

          {/* ═══ USERS ══════════════════════════════════ */}
          {tab === "users" && (
            <div>
              <div className="page-header">
                <h1 className="page-title">Хэрэглэгчид</h1>
                <p className="page-sub">Нийт {userTotal} хэрэглэгч бүртгэлтэй</p>
              </div>
              <div className="toolbar">
                <div className="search-wrap" style={{ width: 240 }}>
                  <span style={{ color: "#94A3B8" }}>⌕</span>
                  <input placeholder="Нэр, и-мэйл…" value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); }}
                    onKeyDown={e => { if (e.key === "Enter") loadUsers(1, userRoleFilter, (e.target as HTMLInputElement).value); }}
                  />
                </div>
                <select className="select" style={{ width: 140 }} value={userRoleFilter}
                  onChange={e => { setUserRoleFilter(e.target.value); loadUsers(1, e.target.value, userSearch); }}>
                  <option value="all">Бүх дүр</option>
                  <option value="student">Сурагч</option>
                  <option value="teacher">Багш</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="spacer" />
                <button className="btn" onClick={() => loadUsers(1, userRoleFilter, userSearch)}>Хайх</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Хэрэглэгч</th>
                      <th style={{ width: 110 }}>Дүр</th>
                      <th style={{ width: 90 }}>XP</th>
                      <th style={{ width: 90 }}>Streak</th>
                      <th style={{ width: 110 }}>Premium</th>
                      <th style={{ width: 120 }}>Нэмэгдсэн</th>
                      <th style={{ width: 70 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr className="loading-row">
                        <td colSpan={7} style={{ padding: "32px 0" }}>
                          <Loading size={72} message="Ачаалж байна…" />
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>Хэрэглэгч олдсонгүй</td></tr>
                    ) : users.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar">{initials2(u.firstName, u.lastName)}</div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{u.lastName} {u.firstName}</div>
                              <div style={{ fontSize: 12, color: "#94A3B8" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select className="select" style={{ height: 28, padding: "0 6px", fontSize: 12, width: 90 }}
                            value={u.role}
                            onChange={e => changeRole(u._id, e.target.value)}>
                            <option value="student">Сурагч</option>
                            <option value="teacher">Багш</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="text-brand" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {u.role === "student" ? (u.xp ?? 0).toLocaleString() : "—"}
                        </td>
                        <td style={{ color: (u.streak ?? 0) > 7 ? "#F59E0B" : "#64748B" }}>
                          {(u.streak ?? 0) > 0 ? `${u.streak}d` : "—"}
                        </td>
                        <td>
                          <button onClick={() => togglePremium(u._id, u.isPremium)}
                            disabled={togglingUsers.has(u._id)}
                            className={`badge ${u.isPremium ? "green" : "gray"}`}
                            style={{ cursor: "pointer", border: "none" }}>
                            {togglingUsers.has(u._id) ? "…" : u.isPremium ? "✓ Premium" : "Энгийн"}
                          </button>
                        </td>
                        <td style={{ color: "#94A3B8", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{fmtDate(u.createdAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="btn sm danger" onClick={() => deleteUser(u._id)}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pager">
                  <span>{users.length ? `${(userPage - 1) * PAGE_SIZE + 1}–${Math.min(userPage * PAGE_SIZE, userTotal)} / ${userTotal}` : "0"}</span>
                  <div className="spacer" />
                  <button className="btn sm" disabled={userPage <= 1} onClick={() => loadUsers(userPage - 1, userRoleFilter, userSearch)}>‹ Өмнөх</button>
                  <button className="btn sm" disabled={userPage * PAGE_SIZE >= userTotal} onClick={() => loadUsers(userPage + 1, userRoleFilter, userSearch)}>Дараах ›</button>
                </div>
              </div>
            </div>
          )}


          {/* ═══ EXAMS ══════════════════════════════════ */}
          {tab === "exams" && (
            <div>
              <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h1 className="page-title">Шалгалтууд</h1>
                  <p className="page-sub">Шалгалт үүсгэж, сурагчдын оролдлогыг хянах</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={loadExams}>Шинэчлэх</button>
                  <button className="btn primary" onClick={() => { setEditingExam(null); setExamForm({ ...EMPTY_EXAM }); setExamModal(true); }}>+ Шалгалт нэмэх</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: selectedExam ? "1fr 1fr" : "1fr", gap: 20 }}>
                <div>
                  <div className="toolbar" style={{ marginBottom: 12 }}>
                    <div className="search-wrap" style={{ width: 260 }}>
                      <span style={{ color: "#94A3B8" }}>⌕</span>
                      <input placeholder="Шалгалт хайх…" value={examSearch} onChange={e => setExamSearch(e.target.value)} />
                    </div>
                  </div>
                  <div className="table-wrap">
                    {filteredExams.length === 0 ? (
                      <div className="empty"><div className="empty-title">{examSearch ? "Тохирох шалгалт олдсонгүй" : "Шалгалт байхгүй байна"}</div></div>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Шалгалт</th>
                            <th style={{ width: 80 }}>Асуулт</th>
                            <th style={{ width: 90 }}>Хугацаа</th>
                            <th style={{ width: 100 }}>Нэмэгдсэн</th>
                            <th style={{ width: 110, textAlign: "right" }}>Үйлдэл</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExams.map(exam => (
                            <tr key={exam._id} style={{ cursor: "pointer" }} onClick={() => { setSelectedExam(exam); loadAttempts(exam._id); }}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{exam.title}</div>
                                {exam.description && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{exam.description}</div>}
                              </td>
                              <td className="text-brand">{exam.questions?.length ?? 0}</td>
                              <td style={{ color: "#64748B" }}>{exam.duration}мин</td>
                              <td style={{ fontSize: 12, color: "#94A3B8" }}>{fmtDate(exam.createdAt)}</td>
                              <td style={{ textAlign: "right" }}>
                                <div className="row-actions" style={{ justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                                  <button className="btn sm" onClick={() => openEditExam(exam)}>Засах</button>
                                  <button className="btn sm danger" onClick={() => deleteExam(exam._id)}>Устгах</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr><td colSpan={5} className="pager">{filteredExams.length} шалгалт</td></tr></tfoot>
                      </table>
                    )}
                  </div>
                </div>

                {selectedExam && (
                  <div>
                    <div className="card" style={{ marginBottom: 14 }}>
                      <div className="card-head">
                        <div><h3>{selectedExam.title}</h3><div className="sub">{examAttempts.length} оролдлого</div></div>
                        <button className="close-btn" onClick={() => { setSelectedExam(null); setExamAttempts([]); }}>×</button>
                      </div>
                    </div>
                    {examAttempts.length === 0 ? (
                      <div className="card"><div className="empty"><div className="empty-sub">Одоогоор оролдлого байхгүй</div></div></div>
                    ) : (
                      <div className="table-wrap">
                        <table className="table">
                          <thead><tr><th>Сурагч</th><th style={{ width: 80 }}>Оноо</th><th style={{ width: 70 }}>%</th><th style={{ width: 90 }}>Огноо</th></tr></thead>
                          <tbody>
                            {examAttempts.map(a => {
                              const pct = a.percentage ?? (a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0);
                              return (
                                <tr key={a._id}>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                        {initials2(a.studentId?.firstName, a.studentId?.lastName)}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 500 }}>{a.studentId?.firstName ?? ""} {a.studentId?.lastName ?? ""}</div>
                                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{a.studentId?.email ?? ""}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-brand" style={{ fontVariantNumeric: "tabular-nums" }}>{a.score}/{a.totalQuestions}</td>
                                  <td><span className={`badge ${pct >= 75 ? "green" : pct >= 50 ? "amber" : "red"}`}>{pct}%</span></td>
                                  <td style={{ fontSize: 12, color: "#94A3B8" }}>{a.finishedAt ? fmtDate(a.finishedAt) : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot><tr><td colSpan={4} className="pager">Дундаж: {Math.round(examAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / examAttempts.length)}%</td></tr></tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "videos" && <VideoLessonManager />}
        </main>
      </div>


      {/* ── EXAM MODAL ──────────────────────────────── */}
      {examModal && (
        <div className="overlay" onClick={closeExamModal}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingExam ? "Шалгалт засах" : "Шинэ шалгалт үүсгэх"}</h2>
              <button className="close-btn" onClick={closeExamModal}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginBottom: 14 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Шалгалтын нэр *</label>
                  <input className="input" placeholder="Жишээ: Цахилгааны I шалгалт" value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Хугацаа (мин)</label>
                  <input type="number" className="input" value={examForm.duration} min={5} onChange={e => setExamForm(f => ({ ...f, duration: +e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label className="label">Тайлбар</label>
                <textarea className="textarea" rows={2} placeholder="Шалгалтын тухай товч тайлбар" value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Асуултууд ({examForm.questions.length})</span>
                <button className="btn sm primary" onClick={addExamQuestion}>+ Асуулт нэмэх</button>
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {examForm.questions.map((q, qi) => (
                  <div key={q.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, background: "#F8FAFC" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Асуулт {qi + 1}</span>
                      {examForm.questions.length > 1 && <button className="btn sm danger" onClick={() => removeExamQuestion(q.id)}>Хасах</button>}
                    </div>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <textarea className="textarea" rows={2} placeholder="Асуултаа оруулна уу" value={q.question} onChange={e => updateExamQ(q.id, "question", e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {q.options.map(opt => (
                        <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt.id} onChange={() => updateExamQ(q.id, "correctAnswer", opt.id)} className="admin-radio" />
                          <span className={`exam-opt-label${q.correctAnswer === opt.id ? " selected" : ""}`}>{opt.id}</span>
                          <input className="input" placeholder={`Хариулт ${opt.id}`} value={opt.text} onChange={e => updateExamOpt(q.id, opt.id, e.target.value)} style={{ borderColor: q.correctAnswer === opt.id ? "#6366F1" : "#E2E8F0" }} />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={closeExamModal}>Болих</button>
              <button className="btn primary" disabled={submitting || !examForm.title.trim()} onClick={saveExam}>{submitting ? "Хадгалж байна…" : editingExam ? "Хадгалах" : "Шалгалт хадгалах"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
