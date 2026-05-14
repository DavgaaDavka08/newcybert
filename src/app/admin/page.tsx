"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────────── */
type Tab = "overview" | "live" | "users" | "questions" | "categories" | "payments" | "exams";

interface ExamOption { id: string; text: string; }
interface ExamQuestion { id: string; question: string; options: ExamOption[]; correctAnswer: string; }
interface ExamItem { _id: string; title: string; description?: string; duration: number; questions: ExamQuestion[]; createdAt: string; }
interface AttemptRow { _id: string; studentId?: { firstName?: string; lastName?: string; email?: string }; score: number; totalQuestions: number; percentage?: number; finishedAt?: string; }

const DEFAULT_EXAM_FORM = { title: "", description: "", duration: 60, questions: [{ id: "1", question: "", options: [{ id: "A", text: "" },{ id: "B", text: "" },{ id: "C", text: "" },{ id: "D", text: "" }], correctAnswer: "A" }] };
function uid() { return Math.random().toString(36).slice(2); }

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
interface Question {
  _id: string; question: string; difficulty: string; level: number;
  xpReward: number; categoryId: { name: string; icon: string };
}
interface Category {
  _id: string; name: string; icon: string; color: string;
  totalLevels: number; isActive: boolean; order: number;
}
interface PayRow {
  _id: string; userId: { firstName?: string; lastName?: string; email?: string } | string;
  amount: number; type: string; status: string; method: string; createdAt: string;
}

/* ─── Q Form ─────────────────────────────────────────────── */
const DEFAULT_QFORM = {
  categoryId: "", level: 1, question: "", options: ["", "", "", ""],
  correctIndex: 0, explanation: "", difficulty: "medium", xpReward: 10, coinReward: 5,
};
const DEFAULT_CATFORM = { name: "", icon: "⚡", color: "#4F46E5", totalLevels: 5, order: 0 };

/* ─── Live game local mock ─────────────────────────────────── */
const MOCK_Q = {
  text: "Ом-ын хуулийн томьёо аль нь вэ?",
  options: ["V = IR", "F = ma", "P = IV", "E = mc²"],
  correct: 0,
  votes: [72, 12, 10, 6],
};
const MOCK_PLAYERS = [
  { name: "Батбаяр Э.", initials: "БЭ", score: 1840, streak: 4 },
  { name: "Номин С.",   initials: "НС", score: 1760, streak: 5 },
  { name: "Саруул Д.", initials: "СД", score: 1640, streak: 3 },
  { name: "Энхжин Б.", initials: "ЭБ", score: 1520, streak: 0 },
  { name: "Мөнхбат Т.", initials: "МТ", score: 1380, streak: 2 },
  { name: "Дөлгөөн О.", initials: "ДО", score: 1200, streak: 1 },
];
const CHART_DATA = [45, 72, 38, 91, 64, 83, 57];

/* ─── Helpers ─────────────────────────────────────────────── */
function initials(u: User) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const [tab, setTab]   = useState<Tab>("overview");
  const [stats, setStats]   = useState<Stats | null>(null);
  const [users, setUsers]   = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [qCatFilter, setQCatFilter] = useState("all");
  const [qDiffFilter, setQDiffFilter] = useState("all");
  const [qModal, setQModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [qForm, setQForm] = useState(DEFAULT_QFORM);
  const [catForm, setCatForm] = useState(DEFAULT_CATFORM);
  const [submitting, setSubmitting] = useState(false);

  /* Exam state */
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [examForm, setExamForm] = useState(DEFAULT_EXAM_FORM);
  const [examModal, setExamModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [examAttempts, setExamAttempts] = useState<AttemptRow[]>([]);

  /* Live game state */
  const [livePhase, setLivePhase] = useState<"setup"|"active">("active");
  const [liveTopic, setLiveTopic] = useState("");
  const [liveTimer, setLiveTimer] = useState(30);
  const [liveCountdown, setLiveCountdown] = useState(18);
  const [liveRevealed, setLiveRevealed] = useState(false);
  const [liveQIdx, setLiveQIdx] = useState(4);
  const LIVE_PIN = "847291";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.replace("/dashboard");
  }, [status, session, router]);

  useEffect(() => {
    if (livePhase !== "active" || liveRevealed) return;
    const t = setInterval(() => {
      setLiveCountdown(c => { if (c <= 1) { setLiveRevealed(true); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [livePhase, liveRevealed]);

  const loadStats = useCallback(async () => {
    const r = await fetch("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }, []);
  const loadUsers = useCallback(async () => {
    const r = await fetch("/api/admin/users");
    if (r.ok) { const d = await r.json(); setUsers(d.users ?? []); }
  }, []);
  const loadQuestions = useCallback(async () => {
    const r = await fetch("/api/admin/questions");
    if (r.ok) { const d = await r.json(); setQuestions(d.questions ?? []); }
  }, []);
  const loadCategories = useCallback(async () => {
    const r = await fetch("/api/admin/categories");
    if (r.ok) { const d = await r.json(); setCategories(d.categories ?? []); }
  }, []);

  const loadExams = useCallback(async () => {
    const r = await fetch("/api/exam/exams");
    if (r.ok) { const d = await r.json(); setExams(Array.isArray(d) ? d : []); }
  }, []);

  useEffect(() => {
    if (tab === "overview") loadStats();
    if (tab === "users") { loadUsers(); }
    if (tab === "questions") { loadQuestions(); loadCategories(); }
    if (tab === "categories") loadCategories();
    if (tab === "exams") loadExams();
  }, [tab, loadStats, loadUsers, loadQuestions, loadCategories, loadExams]);

  async function saveQuestion() {
    setSubmitting(true);
    await fetch("/api/admin/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(qForm) });
    setSubmitting(false); setQModal(false); setQForm(DEFAULT_QFORM); loadQuestions();
  }
  async function saveCategory() {
    setSubmitting(true);
    await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    setSubmitting(false); setCatModal(false); setCatForm(DEFAULT_CATFORM); loadCategories();
  }
  async function saveExam() {
    setSubmitting(true);
    const r = await fetch("/api/exam/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(examForm) });
    setSubmitting(false);
    if (r.ok) { setExamModal(false); setExamForm(DEFAULT_EXAM_FORM); loadExams(); }
  }
  async function deleteExam(id: string) {
    if (!confirm("Шалгалтыг устгах уу?")) return;
    await fetch(`/api/exam/exams/${id}`, { method: "DELETE" });
    loadExams();
    if (selectedExam?._id === id) { setSelectedExam(null); setExamAttempts([]); }
  }
  async function loadAttempts(examId: string) {
    const r = await fetch(`/api/exam/attempts/exam/${examId}`);
    if (r.ok) setExamAttempts(await r.json());
  }

  function addExamQuestion() {
    setExamForm(f => ({ ...f, questions: [...f.questions, { id: uid(), question: "", options: [{ id: "A", text: "" },{ id: "B", text: "" },{ id: "C", text: "" },{ id: "D", text: "" }], correctAnswer: "A" }] }));
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

  async function togglePremium(id: string, current: boolean) {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id, isPremium: !current }) });
    loadUsers();
  }

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontFamily: "Inter, system-ui, sans-serif" }}>
      Ачаалж байна...
    </div>
  );

  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
  });
  const filteredQs = questions.filter(q => {
    if (qCatFilter !== "all" && q.categoryId?.name !== qCatFilter) return false;
    if (qDiffFilter !== "all" && q.difficulty !== qDiffFilter) return false;
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const NAV: { id: Tab; icon: string; label: string; badge?: string }[] = [
    { id: "overview",   icon: "📊", label: "Тойм" },
    { id: "live",       icon: "🎮", label: "Шууд тоглолт", badge: "LIVE" },
    { id: "users",      icon: "👥", label: "Хэрэглэгчид" },
    { id: "questions",  icon: "❓", label: "Асуултууд" },
    { id: "categories", icon: "📚", label: "Сэдвүүд" },
    { id: "payments",   icon: "💳", label: "Төлбөр" },
    { id: "exams",      icon: "📝", label: "Шалгалт" },
  ];

  return (
    <>
      <style>{`
        :root {
          --bg:#F7F8FA;--surface:#fff;--surface-alt:#F9FAFB;
          --border:#E5E7EB;--border-soft:#F3F4F6;
          --text:#111827;--text-2:#374151;--muted:#6B7280;--muted-2:#9CA3AF;
          --indigo:#4F46E5;--indigo-50:#EEF2FF;--indigo-100:#E0E7FF;
          --green:#16A34A;--green-bg:#ECFDF5;--green-text:#065F46;--green-border:#A7F3D0;
          --red:#DC2626;--red-bg:#FEF2F2;--red-text:#991B1B;
          --amber:#D97706;--amber-bg:#FFFBEB;--amber-text:#92400E;
          --purple-bg:#F5F3FF;--purple-text:#6D28D9;
        }
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
        button{font-family:inherit;cursor:pointer;border:0}
        input,select,textarea{font-family:inherit}
        .shell{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
        .sidebar{position:sticky;top:0;height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:20px 12px}
        .brand{display:flex;align-items:center;gap:10px;padding:4px 8px 16px}
        .brand-logo{width:32px;height:32px;border-radius:8px;background:var(--indigo);display:grid;place-items:center;color:#fff;font-size:16px;flex:none}
        .nav-section{font-size:10px;font-weight:500;letter-spacing:.1em;color:var(--muted-2);text-transform:uppercase;padding:16px 12px 6px}
        .nav-item{display:flex;align-items:center;gap:10px;padding:8px 12px;margin:1px 0;border-radius:6px;cursor:pointer;color:var(--text-2);font-weight:500;font-size:14px;background:transparent;width:100%;text-align:left;transition:background .1s,color .1s}
        .nav-item:hover{background:var(--surface-alt)}
        .nav-item.active{background:var(--indigo-50);color:var(--indigo)}
        .main{min-width:0;padding:24px}
        .topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px}
        .topbar h1{font-size:22px;font-weight:600;color:var(--text);letter-spacing:-.01em}
        .topbar .sub{font-size:13px;color:var(--muted);margin-top:2px}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:8px}
        .card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)}
        .card-head h3{font-size:14px;font-weight:600;color:var(--text)}
        .card-head .sub{font-size:12px;color:var(--muted);margin-top:2px}
        .card-body{padding:16px}
        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px}
        .stat{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px}
        .stat-label{font-size:12px;color:var(--muted);font-weight:500}
        .stat-value{font-size:24px;font-weight:600;color:var(--text);margin:10px 0 4px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
        .stat-trend{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px}
        .stat-trend.green{color:var(--green)}.stat-trend.red{color:var(--red)}
        .row{display:grid;gap:16px}.row.c2{grid-template-columns:1.5fr 1fr}.row.c3{grid-template-columns:repeat(3,1fr)}
        .badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;background:var(--surface-alt);color:var(--text-2);border:1px solid transparent}
        .badge.indigo{background:var(--indigo-50);color:#3730A3}.badge.purple{background:var(--purple-bg);color:var(--purple-text)}
        .badge.green{background:var(--green-bg);color:var(--green-text)}.badge.red{background:var(--red-bg);color:var(--red-text)}
        .badge.amber{background:var(--amber-bg);color:var(--amber-text)}.badge.gray{background:#F3F4F6;color:#374151}
        .badge.dot::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
        .btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;font-size:13px;font-weight:500;background:var(--surface);color:var(--text-2);border:1px solid var(--border);border-radius:6px;transition:background .1s,border-color .1s}
        .btn:hover{background:var(--surface-alt)}.btn.primary{background:var(--indigo);color:#fff;border-color:var(--indigo)}.btn.primary:hover{background:#4338CA;border-color:#4338CA}
        .btn.danger{color:var(--red)}.btn.danger:hover{background:var(--red-bg);border-color:var(--red)}
        .btn.sm{height:32px;padding:0 10px;font-size:12px}.btn:disabled{opacity:.5;cursor:not-allowed}
        .search-box{display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--muted);font-size:13px}
        .search-box input{border:0;background:transparent;outline:none;flex:1;color:var(--text);font-size:13px}
        .tab-actions{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
        .tab-actions .spacer{flex:1}
        .table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden}
        .table{width:100%;border-collapse:collapse}
        .table th{font-size:11px;font-weight:500;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;padding:10px 14px;text-align:left;background:var(--surface-alt);border-bottom:1px solid var(--border)}
        .table td{padding:12px 14px;font-size:13px;color:var(--text-2);border-bottom:1px solid var(--border-soft);vertical-align:middle}
        .table tbody tr:last-child td{border-bottom:0}
        .table tbody tr:hover td{background:#FAFBFC}
        .table .actions{display:flex;gap:4px;opacity:0;transition:opacity .1s}.table tr:hover .actions{opacity:1}
        .pager{display:flex;align-items:center;padding:12px 16px;border-top:1px solid var(--border)}
        .pager-info{font-size:13px;color:var(--muted)}.pager .spacer{flex:1}
        .pager-btns{display:flex;gap:4px}
        .pager-btn{min-width:32px;height:32px;padding:0 8px;border:1px solid var(--border);background:var(--surface);border-radius:6px;font-size:13px;color:var(--text-2);display:inline-flex;align-items:center;justify-content:center}
        .pager-btn:hover{background:var(--surface-alt)}.pager-btn.active{background:var(--indigo);color:#fff;border-color:var(--indigo)}.pager-btn:disabled{opacity:.4;cursor:not-allowed}
        .input,.select,.textarea{width:100%;height:36px;padding:0 10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;outline:none;transition:border-color .1s,box-shadow .1s}
        .textarea{height:auto;padding:10px;resize:vertical;line-height:1.5;font-size:14px}
        .input:focus,.select:focus,.textarea:focus{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(79,70,229,.12)}
        .label{display:block;font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
        .field{margin-bottom:14px}
        .modal-overlay{position:fixed;inset:0;background:rgba(17,24,39,.4);display:grid;place-items:center;z-index:100;padding:24px;animation:fadeIn .12s ease}
        .modal{background:var(--surface);border-radius:12px;width:100%;max-width:540px;max-height:85vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,.15);animation:pop .14s ease}
        .modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border)}
        .modal-head h2{font-size:18px;font-weight:600;color:var(--text)}
        .modal-body{padding:20px 24px}
        .modal-foot{display:flex;gap:8px;padding:14px 24px;border-top:1px solid var(--border);justify-content:flex-end}
        .icon-btn{width:28px;height:28px;border-radius:6px;background:transparent;color:var(--muted);display:grid;place-items:center;transition:background .1s,color .1s;font-size:16px}
        .icon-btn:hover{background:var(--surface-alt);color:var(--text)}
        .seg{display:inline-flex;padding:2px;gap:2px;background:var(--surface-alt);border:1px solid var(--border);border-radius:6px}
        .seg-btn{padding:5px 12px;font-size:12px;font-weight:500;border-radius:4px;color:var(--text-2);background:transparent}
        .seg-btn.active{background:var(--surface);color:var(--indigo);box-shadow:0 1px 2px rgba(0,0,0,.06)}
        .avatar{width:32px;height:32px;border-radius:50%;background:var(--indigo-50);display:grid;place-items:center;color:var(--indigo);font-size:12px;font-weight:600;flex:none}
        .user-card{margin-top:auto;padding:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px}
        .link{font-size:13px;color:var(--indigo);font-weight:500;background:transparent}
        .link:hover{text-decoration:underline}
        .scrollbar::-webkit-scrollbar{width:6px;height:6px}
        .scrollbar::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:8px}
        .scrollbar::-webkit-scrollbar-track{background:transparent}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pop{from{transform:scale(.97);opacity:0}to{transform:scale(1);opacity:1}}
      `}</style>

      <div className="shell">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">⚡</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", letterSpacing: "-.01em" }}>CyberPhysics</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", color: "var(--indigo)", textTransform: "uppercase", marginTop: 1 }}>Admin</div>
            </div>
          </div>

          <div className="nav-section">Удирдлага</div>
          {NAV.map(n => (
            <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", background: "#DCFCE7", color: "#15803D", padding: "2px 5px", borderRadius: 4 }}>
                  {n.badge}
                </span>
              )}
            </button>
          ))}

          <div className="user-card">
            <div className="avatar" style={{ fontSize: 11 }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{session?.user?.name ?? "Admin"}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.email}</div>
            </div>
            <button className="icon-btn" onClick={() => signOut({ callbackUrl: "/login" })} title="Гарах">⎋</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main scrollbar" style={{ overflowY: "auto" }}>

          {/* ══ OVERVIEW ══════════════════════════════════ */}
          {tab === "overview" && (
            <div>
              <div className="topbar">
                <div>
                  <h1>Тойм</h1>
                  <div className="sub">CyberPhysics платформын өнөөдрийн байдал</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn sm" onClick={loadStats}>↻ Шинэчлэх</button>
                </div>
              </div>

              {stats ? (
                <>
                  <div className="stat-grid">
                    {[
                      { icon: "👥", label: "Нийт хэрэглэгч",    value: stats.totalUsers.toLocaleString(),                       trend: `+${stats.newUsersLast7} энэ 7 хоногт`,     trendColor: "green" },
                      { icon: "⭐", label: "Premium хэрэглэгч",  value: stats.premiumUsers.toLocaleString(),                     trend: `${Math.round(stats.premiumUsers/Math.max(stats.totalUsers,1)*100)}% нийтийн` },
                      { icon: "📡", label: "Өнөөдөр идэвхтэй",   value: stats.todayActive.toLocaleString(),                      trend: "Өнөөдрийн идэвхтэй" },
                      { icon: "💰", label: "Нийт орлого",         value: `${(stats.totalRevenue/1000000).toFixed(2)}M₮`,         trend: "Нийт цуглуулсан",                           trendColor: "green" },
                    ].map((s, i) => (
                      <div key={i} className="stat">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <span className="stat-label">{s.label}</span>
                          <span style={{ fontSize: 20 }}>{s.icon}</span>
                        </div>
                        <div className="stat-value">{s.value}</div>
                        <div className={`stat-trend ${s.trendColor ?? ""}`}>{s.trend}</div>
                      </div>
                    ))}
                  </div>

                  <div className="row c2" style={{ marginBottom: 16 }}>
                    {/* Line chart */}
                    <div className="card">
                      <div className="card-head">
                        <div>
                          <h3>Шинэ хэрэглэгч — сүүлийн 7 хоног</h3>
                          <div className="sub">Өдөр бүрийн шинэ бүртгэлийн тоо</div>
                        </div>
                        <div className="seg">
                          <button className="seg-btn active">7 хоног</button>
                          <button className="seg-btn">30 хоног</button>
                        </div>
                      </div>
                      <div className="card-body">
                        <LineChart data={CHART_DATA} labels={["Да","Мя","Лх","Пү","Ба","Бя","Ня"]} />
                      </div>
                    </div>
                    {/* System status */}
                    <div className="card">
                      <div className="card-head">
                        <h3>Системийн төлөв</h3>
                        <span className="badge green dot">Хэвийн</span>
                      </div>
                      <div className="card-body" style={{ padding: 0 }}>
                        {[
                          { label: "MongoDB Atlas",   value: "Холбогдсон" },
                          { label: "API хариу",        value: "~140ms"      },
                          { label: "Google OAuth",     value: "Идэвхтэй"   },
                          { label: "Gmail SMTP",       value: "Идэвхтэй"   },
                          { label: "QPay",             value: "Идэвхтэй"   },
                        ].map((it, i, arr) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border-soft)" : 0, fontSize: 13 }}>
                            <span style={{ color: "var(--text-2)" }}>{it.label}</span>
                            <span style={{ color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, fontSize: 12 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                              {it.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="row c2">
                    {/* By province */}
                    <div className="card">
                      <div className="card-head">
                        <div><h3>Аймгаар харах</h3><div className="sub">Сурагчдын тоо</div></div>
                        <span className="badge">Нийт</span>
                      </div>
                      <div className="card-body">
                        {(stats.byProvince ?? []).slice(0,6).map((p, i) => {
                          const max = stats.byProvince[0]?.count ?? 1;
                          return (
                            <div key={i} style={{ marginBottom: i < 5 ? 12 : 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{p._id || "Тодорхойгүй"}</span>
                                <span style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{p.count}</span>
                              </div>
                              <div style={{ height: 6, background: "var(--border-soft)", borderRadius: 3 }}>
                                <div style={{ width: `${(p.count/max)*100}%`, height: "100%", background: "var(--indigo)", borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Recent payments */}
                    <div className="card">
                      <div className="card-head">
                        <div><h3>Сүүлийн төлбөрүүд</h3><div className="sub">QPay болон Khan Bank</div></div>
                      </div>
                      <div className="card-body" style={{ padding: 0 }}>
                        {(stats.recentPayments ?? []).slice(0,5).map((p: any, i: number, arr: any[]) => (
                          <div key={p._id ?? i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: i < arr.length-1 ? "1px solid var(--border-soft)" : 0 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
                                {typeof p.userId === "object" ? `${p.userId?.firstName ?? ""} ${p.userId?.lastName ?? ""}`.trim() || p.userId?.email : "Хэрэглэгч"}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(p.createdAt)}</div>
                            </div>
                            <span className={`badge ${p.method === "qpay" ? "indigo" : "amber"}`}>{p.method?.toUpperCase()}</span>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", minWidth: 76, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                              {(p.amount ?? 0).toLocaleString()}₮
                            </div>
                          </div>
                        ))}
                        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-soft)" }}>
                          <button className="link" onClick={() => setTab("payments")}>Бүгдийг харах →</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                  Ачаалж байна...
                </div>
              )}
            </div>
          )}

          {/* ══ LIVE GAME ══════════════════════════════════ */}
          {tab === "live" && (
            <div>
              <div className="topbar">
                <div>
                  <h1>Шууд тоглолт</h1>
                  <div className="sub">Сурагчидтай шууд PIN-д нэгдсэн тоглолт удирдах</div>
                </div>
                <span className="badge green dot">Идэвхтэй сесс</span>
              </div>

              <div className="row" style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Session card */}
                  <div className="card">
                    <div className="card-head">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h3>Идэвхтэй сесс</h3>
                        <span className="badge green dot">Идэвхтэй</span>
                      </div>
                      <span className="badge indigo">Цахилгаан · Lvl 1</span>
                    </div>
                    <div className="card-body">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
                        <div>
                          <div className="label" style={{ marginBottom: 4 }}>JOIN PIN</div>
                          <div style={{ fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 44, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                            {LIVE_PIN}
                          </div>
                          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                            <button className="btn sm" onClick={() => navigator.clipboard?.writeText(LIVE_PIN)}>📋 Хуулах</button>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                            Сурагчид{" "}
                            <span style={{ color: "var(--indigo)", fontWeight: 500 }}>cyberphysics.mn/join</span>
                            {" "}хаягаар орж PIN оруулна
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,auto)", gap: 16, columnGap: 28 }}>
                          {[
                            { label: "Асуулт",    value: `${liveQIdx}/10` },
                            { label: "Сурагчид",  value: MOCK_PLAYERS.length },
                            { label: "Хариулсан", value: `${liveRevealed ? MOCK_PLAYERS.length : Math.floor(MOCK_PLAYERS.length*.78)}/${MOCK_PLAYERS.length}` },
                          ].map((m, i) => (
                            <div key={i}>
                              <div className="label" style={{ marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-alt)" }}>
                      <button className="btn">⏸ Зогсоох</button>
                      <button className="btn danger">⏹ Дуусгах</button>
                      <div style={{ flex: 1 }} />
                      <button className="btn primary" onClick={() => { setLiveQIdx(i => Math.min(i+1,10)); setLiveCountdown(liveTimer); setLiveRevealed(false); }}>
                        Дараагийн асуулт →
                      </button>
                    </div>
                  </div>

                  {/* Active question */}
                  <div className="card">
                    <div className="card-head">
                      <h3>Идэвхтэй асуулт</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>Хугацаа</span>
                        <CountdownRing value={liveCountdown} max={liveTimer} />
                      </div>
                    </div>
                    <div className="card-body">
                      <div style={{ fontSize: 17, fontWeight: 500, color: "var(--text)", marginBottom: 16, lineHeight: 1.4 }}>{MOCK_Q.text}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {MOCK_Q.options.map((opt, i) => {
                          const isCorrect = i === MOCK_Q.correct;
                          const pct = MOCK_Q.votes[i];
                          const reveal = liveRevealed && isCorrect;
                          return (
                            <div key={i} style={{ position: "relative", padding: "12px 14px", border: `1px solid ${reveal ? "var(--green)" : "var(--border)"}`, background: reveal ? "var(--green-bg)" : "var(--surface)", borderRadius: 6, overflow: "hidden" }}>
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: reveal ? "rgba(22,163,74,.10)" : "rgba(79,70,229,.06)", transition: "width .6s ease" }} />
                              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 4, background: reveal ? "var(--green)" : "var(--border-soft)", color: reveal ? "#fff" : "var(--text-2)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600, flex: "none" }}>{"ABCD"[i]}</div>
                                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{opt}</div>
                                {reveal && <span style={{ color: "var(--green)" }}>✓</span>}
                                <div style={{ fontSize: 13, fontWeight: 600, color: reveal ? "var(--green)" : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {liveRevealed && (
                        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: "var(--green-bg)", border: "1px solid var(--green-border)", fontSize: 13, color: "var(--green-text)", display: "flex", alignItems: "center", gap: 8 }}>
                          ✓ Зөв хариулт: <strong>A · V = IR</strong> · {MOCK_Q.votes[MOCK_Q.correct]}% сурагч зөв хариуллаа
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New session */}
                  <div className="card">
                    <div className="card-head"><h3>Шинэ тоглолт үүсгэх</h3></div>
                    <div className="card-body" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <label className="label">Сэдэв</label>
                        <select className="select" value={liveTopic} onChange={e => setLiveTopic(e.target.value)}>
                          <option value="">— Сонгох —</option>
                          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div style={{ width: 140 }}>
                        <label className="label">Хугацаа</label>
                        <select className="select" value={liveTimer} onChange={e => setLiveTimer(+e.target.value)}>
                          {[15,20,30,45,60].map(t => <option key={t} value={t}>{t} секунд</option>)}
                        </select>
                      </div>
                      <button className="btn primary">▶ Шинэ PIN үүсгэх</button>
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="card">
                  <div className="card-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3>Тэргүүлэгчид</h3>
                      <span className="badge green dot">Шууд</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{MOCK_PLAYERS.length} холбогдсон</span>
                  </div>
                  <div className="scrollbar" style={{ maxHeight: 520, overflowY: "auto" }}>
                    <table className="table">
                      <thead><tr><th style={{ width: 40 }}>#</th><th>Сурагч</th><th style={{ textAlign: "right", paddingRight: 16 }}>Оноо</th></tr></thead>
                      <tbody>
                        {MOCK_PLAYERS.map((p, i) => (
                          <tr key={i}>
                            <td style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums", fontWeight: i < 3 ? 600 : 400 }}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i+1}
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{p.initials}</div>
                                <div>
                                  <div style={{ fontWeight: 500, color: "var(--text)" }}>{p.name}</div>
                                  {p.streak > 0 && <div style={{ fontSize: 11, color: "var(--amber)" }}>🔥 {p.streak}d streak</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums", paddingRight: 16 }}>{p.score.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ USERS ══════════════════════════════════════ */}
          {tab === "users" && (
            <div>
              <div className="topbar">
                <div><h1>Хэрэглэгчид</h1><div className="sub">Нийт {users.length} хэрэглэгч бүртгэлтэй</div></div>
              </div>
              <div className="tab-actions">
                <div className="search-box" style={{ width: 240 }}>
                  🔍
                  <input placeholder="Нэр, и-мэйл хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select" value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} style={{ width: 140 }}>
                  <option value="all">Бүгд</option>
                  <option value="student">Сурагч</option>
                  <option value="teacher">Багш</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="spacer" />
                <button className="btn primary" onClick={loadUsers}>↻ Шинэчлэх</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Хэрэглэгч</th>
                      <th style={{ width: 90 }}>Дүр</th>
                      <th style={{ width: 80 }}>XP</th>
                      <th style={{ width: 80 }}>Streak</th>
                      <th style={{ width: 100 }}>Premium</th>
                      <th style={{ width: 120 }}>Нэмэгдсэн</th>
                      <th style={{ width: 80, textAlign: "right" }}>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar">{initials(u)}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{u.lastName} {u.firstName}</div>
                              <div style={{ fontSize: 12, color: "var(--muted-2)" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${u.role === "admin" ? "purple" : u.role === "teacher" ? "indigo" : "gray"}`}>
                            {u.role === "admin" ? "Admin" : u.role === "teacher" ? "Багш" : "Сурагч"}
                          </span>
                        </td>
                        <td style={{ color: "var(--indigo)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          {u.role === "student" ? (u.xp ?? 0).toLocaleString() : "—"}
                        </td>
                        <td style={{ color: (u.streak ?? 0) > 7 ? "var(--amber)" : (u.streak ?? 0) > 0 ? "var(--text-2)" : "var(--muted-2)", fontVariantNumeric: "tabular-nums" }}>
                          {(u.streak ?? 0) > 0 ? `${u.streak}d` : "—"}
                        </td>
                        <td>
                          <button onClick={() => togglePremium(u._id, u.isPremium)} className="badge" style={{ cursor: "pointer", background: u.isPremium ? "var(--green-bg)" : "var(--surface)", color: u.isPremium ? "var(--green-text)" : "var(--muted)", border: `1px solid ${u.isPremium ? "var(--green-border)" : "var(--border)"}` }}>
                            {u.isPremium ? "Premium" : "Энгийн"}
                          </button>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{fmtDate(u.createdAt)}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="actions" style={{ justifyContent: "flex-end" }}>
                            <button className="icon-btn">✏️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pager">
                  <span className="pager-info">Нийт {filteredUsers.length} хэрэглэгч</span>
                </div>
              </div>
            </div>
          )}

          {/* ══ QUESTIONS ══════════════════════════════════ */}
          {tab === "questions" && (
            <div>
              <div className="topbar">
                <div><h1>Асуултууд</h1><div className="sub">Нийт {questions.length} асуулт</div></div>
              </div>
              <div className="tab-actions">
                <select className="select" value={qCatFilter} onChange={e => setQCatFilter(e.target.value)} style={{ width: 160 }}>
                  <option value="all">Бүх сэдэв</option>
                  {categories.map(c => <option key={c._id}>{c.name}</option>)}
                </select>
                <select className="select" value={qDiffFilter} onChange={e => setQDiffFilter(e.target.value)} style={{ width: 120 }}>
                  <option value="all">Бүх хүнд</option>
                  <option value="easy">Хялбар</option>
                  <option value="medium">Дунд</option>
                  <option value="hard">Хэцүү</option>
                </select>
                <div className="search-box" style={{ width: 220 }}>
                  🔍<input placeholder="Асуулт хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="spacer" />
                <button className="btn primary" onClick={() => setQModal(true)}>＋ Асуулт нэмэх</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Асуулт</th>
                      <th style={{ width: 140 }}>Сэдэв</th>
                      <th style={{ width: 60 }}>Lvl</th>
                      <th style={{ width: 90 }}>Хүнд</th>
                      <th style={{ width: 60 }}>XP</th>
                      <th style={{ width: 80, textAlign: "right" }}>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQs.map(q => (
                      <tr key={q._id}>
                        <td style={{ maxWidth: 360 }}>
                          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</div>
                        </td>
                        <td style={{ fontSize: 13, color: "var(--text-2)" }}>{q.categoryId?.name ?? "—"}</td>
                        <td style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{q.level}</td>
                        <td>
                          <span className={`badge ${q.difficulty === "easy" ? "green" : q.difficulty === "hard" ? "red" : "amber"}`}>
                            {q.difficulty === "easy" ? "Хялбар" : q.difficulty === "hard" ? "Хэцүү" : "Дунд"}
                          </span>
                        </td>
                        <td style={{ color: "var(--indigo)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>+{q.xpReward}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="actions" style={{ justifyContent: "flex-end" }}>
                            <button className="icon-btn">✏️</button>
                            <button className="icon-btn" style={{ color: "var(--red)" }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pager">
                  <span className="pager-info">{filteredQs.length} / {questions.length} асуулт</span>
                </div>
              </div>
            </div>
          )}

          {/* ══ CATEGORIES ══════════════════════════════════ */}
          {tab === "categories" && (
            <div>
              <div className="topbar">
                <div><h1>Сэдвүүд</h1><div className="sub">{categories.length} сэдэв нийт</div></div>
              </div>
              <div className="tab-actions">
                <div className="spacer" />
                <button className="btn primary" onClick={() => setCatModal(true)}>＋ Сэдэв нэмэх</button>
              </div>
              <div className="row c3">
                {categories.map(c => (
                  <div key={c._id} className="card">
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + "22", color: c.color, display: "grid", placeItems: "center", fontSize: 20 }}>
                          {c.icon}
                        </div>
                        <span className={`badge ${c.isActive ? "green dot" : "gray"}`}>{c.isActive ? "Идэвхтэй" : "Идэвхгүй"}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{c.totalLevels} level · Дараалал {c.order}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn sm" style={{ flex: 1 }}>✏️ Засах</button>
                        <button className="btn sm" style={{ flex: 1 }}>📋 Асуултууд</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setCatModal(true)} style={{ background: "transparent", border: "1px dashed var(--border)", borderRadius: 8, padding: 16, color: "var(--muted)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 180, transition: "all .1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--indigo)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--indigo)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--indigo-50)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <span style={{ fontSize: 22 }}>＋</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Шинэ сэдэв нэмэх</span>
                </button>
              </div>
            </div>
          )}

          {/* ══ PAYMENTS ══════════════════════════════════ */}
          {tab === "payments" && (
            <div>
              <div className="topbar">
                <div><h1>Төлбөр</h1><div className="sub">QPay болон Khan Bank гүйлгээнүүд</div></div>
              </div>
              <div className="stat-grid" style={{ marginBottom: 20 }}>
                {[
                  { icon: "💰", label: "Нийт орлого",       value: "8.42M₮",  trend: "Бүх цаг хугацаа" },
                  { icon: "📈", label: "Энэ сарын орлого",   value: "2.15M₮",  trend: "+18.4% өмнөх сар", trendColor: "green" },
                  { icon: "📱", label: "QPay орлого",         value: "4.92M₮",  trend: "58% эзлэх" },
                  { icon: "🏦", label: "Khan Bank",           value: "3.50M₮",  trend: "42% эзлэх" },
                ].map((s, i) => (
                  <div key={i} className="stat">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span className="stat-label">{s.label}</span>
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                    </div>
                    <div className="stat-value">{s.value}</div>
                    <div className={`stat-trend ${(s as any).trendColor ?? ""}`}>{s.trend}</div>
                  </div>
                ))}
              </div>
              <div className="tab-actions">
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Саяхны гүйлгээнүүд</span>
                <div className="spacer" />
                <button className="btn">⬇ Excel экспорт</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Хэрэглэгч</th>
                      <th>Бүтээгдэхүүн</th>
                      <th style={{ width: 110 }}>Арга</th>
                      <th style={{ width: 130 }}>Огноо</th>
                      <th style={{ width: 110, textAlign: "right" }}>Дүн</th>
                      <th style={{ width: 110 }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentPayments ?? []).map((p: any, i: number) => (
                      <tr key={p._id ?? i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                              {typeof p.userId === "object" ? `${p.userId?.firstName?.[0] ?? ""}${p.userId?.lastName?.[0] ?? ""}` : "U"}
                            </div>
                            <span style={{ fontWeight: 500, color: "var(--text)" }}>
                              {typeof p.userId === "object" ? `${p.userId?.firstName ?? ""} ${p.userId?.lastName ?? ""}`.trim() || "—" : "Хэрэглэгч"}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-2)" }}>{p.type}</td>
                        <td><span className={`badge ${p.method === "qpay" ? "indigo" : "amber"}`}>{p.method?.toUpperCase()}</span></td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{fmtDate(p.createdAt)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{(p.amount ?? 0).toLocaleString()}₮</td>
                        <td>
                          <span className={`badge ${p.status === "success" ? "green" : p.status === "pending" ? "amber" : p.status === "failed" ? "red" : "gray"}`}>
                            {p.status === "success" ? "Амжилттай" : p.status === "pending" ? "Хүлээгдэж" : p.status === "failed" ? "Алдаа" : "Цуцлагдсан"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pager">
                  <span className="pager-info">{(stats?.recentPayments ?? []).length} гүйлгээ</span>
                </div>
              </div>
            </div>
          )}
          {/* ══ EXAMS ══════════════════════════════════════ */}
          {tab === "exams" && (
            <div>
              <div className="topbar">
                <div>
                  <h1>Шалгалтын удирдлага</h1>
                  <div className="sub">Шалгалт үүсгэх, сурагчдын үр дүнг хянах</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={loadExams}>↻ Шинэчлэх</button>
                  <button className="btn primary" onClick={() => { setExamForm(DEFAULT_EXAM_FORM); setExamModal(true); }}>＋ Шалгалт нэмэх</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: selectedExam ? "1fr 1fr" : "1fr", gap: 20 }}>
                {/* Exam list */}
                <div>
                  {exams.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Шалгалт байхгүй байна</div>
                      <button className="btn primary" onClick={() => setExamModal(true)} style={{ marginTop: 12 }}>＋ Анхны шалгалтаа нэмэх</button>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Шалгалт</th>
                            <th style={{ width: 80 }}>Асуулт</th>
                            <th style={{ width: 80 }}>Хугацаа</th>
                            <th style={{ width: 90 }}>Нэмэгдсэн</th>
                            <th style={{ width: 100, textAlign: "right" }}>Үйлдэл</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exams.map(exam => (
                            <tr key={exam._id} style={{ cursor: "pointer" }} onClick={() => { setSelectedExam(exam); loadAttempts(exam._id); }}>
                              <td>
                                <div style={{ fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 16 }}>📝</span>
                                  {exam.title}
                                </div>
                                {exam.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{exam.description}</div>}
                              </td>
                              <td style={{ color: "var(--indigo)", fontWeight: 600 }}>{exam.questions?.length ?? 0}</td>
                              <td style={{ color: "var(--text-2)" }}>{exam.duration}мин</td>
                              <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(exam.createdAt)}</td>
                              <td style={{ textAlign: "right" }}>
                                <div className="actions" style={{ justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                                  <button className="icon-btn" style={{ color: "var(--red)" }} onClick={() => deleteExam(exam._id)}>🗑</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="pager"><span className="pager-info">{exams.length} шалгалт</span></div>
                    </div>
                  )}
                </div>

                {/* Attempts for selected exam */}
                {selectedExam && (
                  <div>
                    <div className="card" style={{ marginBottom: 12 }}>
                      <div className="card-head">
                        <div>
                          <h3>📊 {selectedExam.title}</h3>
                          <div className="sub">{examAttempts.length} оролдлого</div>
                        </div>
                        <button className="icon-btn" onClick={() => { setSelectedExam(null); setExamAttempts([]); }}>✕</button>
                      </div>
                    </div>

                    {examAttempts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
                        Сурагчид одоогоор шалгалт өгөөгүй байна
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Сурагч</th>
                              <th style={{ width: 80 }}>Оноо</th>
                              <th style={{ width: 70 }}>Хувь</th>
                              <th style={{ width: 90 }}>Огноо</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examAttempts.map((a, i) => {
                              const pct = a.percentage ?? (a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0);
                              return (
                                <tr key={a._id}>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                        {a.studentId?.firstName?.[0] ?? "?"}{a.studentId?.lastName?.[0] ?? ""}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 500, color: "var(--text)" }}>{a.studentId?.firstName ?? ""} {a.studentId?.lastName ?? ""}</div>
                                        <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{a.studentId?.email ?? ""}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 600, color: "var(--indigo)", fontVariantNumeric: "tabular-nums" }}>
                                    {a.score}/{a.totalQuestions}
                                  </td>
                                  <td>
                                    <span className={`badge ${pct >= 75 ? "green" : pct >= 50 ? "amber" : "red"}`}>{pct}%</span>
                                  </td>
                                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{a.finishedAt ? fmtDate(a.finishedAt) : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="pager">
                          <span className="pager-info">{examAttempts.length} оролдлого</span>
                          <div style={{ flex: 1 }} />
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            Дундаж: {examAttempts.length > 0 ? Math.round(examAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / examAttempts.length) : 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══ QUESTION MODAL ════════════════════════════════ */}
      {qModal && (
        <div className="modal-overlay" onClick={() => setQModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Асуулт нэмэх</h2>
              <button className="icon-btn" onClick={() => setQModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px", gap: 12, marginBottom: 14 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Сэдэв</label>
                  <select className="select" value={qForm.categoryId} onChange={e => setQForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">— Сонгох —</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Level</label>
                  <input type="number" className="input" value={qForm.level} min={1} onChange={e => setQForm(f => ({ ...f, level: +e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Хүнд</label>
                  <select className="select" value={qForm.difficulty} onChange={e => setQForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="easy">Хялбар</option>
                    <option value="medium">Дунд</option>
                    <option value="hard">Хэцүү</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Асуулт</label>
                <textarea className="textarea" rows={3} placeholder="Жишээ: Ом-ын хуулийн томьёо?" value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Хариултууд</label>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Зөв хариултыг сонгоно уу</div>
                {qForm.options.map((o, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <input type="radio" name="correct" checked={qForm.correctIndex === i} onChange={() => setQForm(f => ({ ...f, correctIndex: i }))} style={{ accentColor: "var(--indigo)", width: 16, height: 16, flex: "none" }} />
                    <input className="input" placeholder={`Хариулт ${"ABCD"[i]}`} value={o} onChange={e => setQForm(f => ({ ...f, options: f.options.map((v, k) => k === i ? e.target.value : v) }))} style={{ borderColor: qForm.correctIndex === i ? "var(--indigo)" : "var(--border)" }} />
                  </label>
                ))}
              </div>
              <div className="field">
                <label className="label">Тайлбар</label>
                <textarea className="textarea" rows={2} placeholder="Зөв хариултын тайлбар..." value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 100px", gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">XP шагнал</label>
                  <input type="number" className="input" value={qForm.xpReward} onChange={e => setQForm(f => ({ ...f, xpReward: +e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Coin шагнал</label>
                  <input type="number" className="input" value={qForm.coinReward} onChange={e => setQForm(f => ({ ...f, coinReward: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setQModal(false)}>Болих</button>
              <button className="btn primary" disabled={submitting} onClick={saveQuestion}>{submitting ? "Хадгалж байна..." : "Хадгалах"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CATEGORY MODAL ════════════════════════════════ */}
      {catModal && (
        <div className="modal-overlay" onClick={() => setCatModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Сэдэв нэмэх</h2>
              <button className="icon-btn" onClick={() => setCatModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="label">Нэр</label>
                <input className="input" placeholder="Жишээ: Оптик" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Icon (emoji)</label>
                <input className="input" placeholder="⚡" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Өнгө (hex)</label>
                <input className="input" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Нийт level тоо</label>
                  <input type="number" className="input" value={catForm.totalLevels} min={1} onChange={e => setCatForm(f => ({ ...f, totalLevels: +e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Дараалал</label>
                  <input type="number" className="input" value={catForm.order} min={0} onChange={e => setCatForm(f => ({ ...f, order: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setCatModal(false)}>Болих</button>
              <button className="btn primary" disabled={submitting} onClick={saveCategory}>{submitting ? "Хадгалж байна..." : "Хадгалах"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EXAM CREATION MODAL ═══════════════════════════ */}
      {examModal && (
        <div className="modal-overlay" onClick={() => setExamModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>📝 Шинэ шалгалт үүсгэх</h2>
              <button className="icon-btn" onClick={() => setExamModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Basic info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12, marginBottom: 14 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Шалгалтын нэр</label>
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

              {/* Questions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>Асуултууд ({examForm.questions.length})</div>
                <button className="btn sm primary" onClick={addExamQuestion}>＋ Асуулт нэмэх</button>
              </div>

              <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {examForm.questions.map((q, qi) => (
                  <div key={q.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, background: "var(--surface-alt)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>Асуулт {qi + 1}</span>
                      {examForm.questions.length > 1 && (
                        <button className="icon-btn" style={{ color: "var(--red)" }} onClick={() => removeExamQuestion(q.id)}>🗑</button>
                      )}
                    </div>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <textarea className="textarea" rows={2} placeholder="Асуултаа оруулна уу" value={q.question} onChange={e => updateExamQ(q.id, "question", e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {q.options.map(opt => (
                        <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt.id} onChange={() => updateExamQ(q.id, "correctAnswer", opt.id)} style={{ accentColor: "var(--indigo)", width: 15, height: 15, flex: "none" }} />
                          <span style={{ display: "flex", width: 24, height: 24, borderRadius: 4, background: "var(--border-soft)", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flex: "none" }}>{opt.id}</span>
                          <input className="input" placeholder={`Хариулт ${opt.id}`} value={opt.text} onChange={e => updateExamOpt(q.id, opt.id, e.target.value)} style={{ borderColor: q.correctAnswer === opt.id ? "var(--indigo)" : "var(--border)" }} />
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>☝ Зөв хариулт: <b>{q.correctAnswer}</b></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setExamModal(false)}>Болих</button>
              <button className="btn primary" disabled={submitting} onClick={saveExam}>{submitting ? "Хадгалж байна..." : "✅ Шалгалт хадгалах"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */
function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 560, h = 160, padL = 36, padR = 14, padT = 14, padB = 26;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max(...data, 10), min = 0;
  const xs = data.map((_, i) => padL + (i / (data.length - 1)) * innerW);
  const ys = data.map(v => padT + (1 - (v - min) / (max - min)) * innerH);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h, display: "block" }}>
      {[0, Math.round(max/2), max].map(v => {
        const y = padT + (1 - (v - min) / (max - min)) * innerH;
        return (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} fill="#9CA3AF" fontSize="11" textAnchor="end">{v}</text>
          </g>
        );
      })}
      <path d={path} fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="4" fill="#fff" stroke="#4F46E5" strokeWidth="2" />)}
      {labels.map((lab, i) => <text key={i} x={xs[i]} y={h - 6} fill="#9CA3AF" fontSize="12" textAnchor="middle">{lab}</text>)}
    </svg>
  );
}

function CountdownRing({ value, max }: { value: number; max: number }) {
  const r = 19, circ = 2 * Math.PI * r;
  const stroke = value < 6 ? "#DC2626" : value < 12 ? "#D97706" : "#4F46E5";
  return (
    <div style={{ position: "relative", width: 44, height: 44 }}>
      <svg viewBox="0 0 44 44" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#F3F4F6" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / max)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}
