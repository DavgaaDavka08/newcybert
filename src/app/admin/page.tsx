"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { ContentManager } from "@/components/admin/ContentManager";

// ── Types ─────────────────────────────────────────────────────
type Tab = "overview" | "content" | "live" | "users" | "questions" | "categories" | "exams";

interface Toast { id: number; msg: string; type: "ok" | "err"; }
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
interface QuestionDoc {
  _id: string; question: string; difficulty: string; level: number;
  xpReward: number; coinReward: number;
  options: string[]; correctIndex: number; explanation: string;
  categoryId: { _id: string; name: string; icon: string } | null;
}
interface Category {
  _id: string; name: string; icon: string; color: string;
  totalLevels: number; isActive: boolean; order: number;
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
const EMPTY_Q = { categoryId: "", level: 1, question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", difficulty: "medium", xpReward: 10, coinReward: 5 };
const EMPTY_CAT = { name: "", icon: "", color: "#4F46E5", totalLevels: 5, order: 0 };
const EMPTY_EXAM = { title: "", description: "", duration: 60, questions: [{ id: "1", question: "", options: [{ id: "A", text: "" }, { id: "B", text: "" }, { id: "C", text: "" }, { id: "D", text: "" }], correctAnswer: "A" }] };
const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────
let _tid = 0;
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

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  function toast(msg: string, type: "ok" | "err" = "ok") {
    const id = ++_tid;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [questions, setQuestions] = useState<QuestionDoc[]>([]);
  const [qTotal, setQTotal] = useState(0);
  const [qPage, setQPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [lbPlayers, setLbPlayers] = useState<LbEntry[]>([]);
  const [examAttempts, setExamAttempts] = useState<AttemptRow[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);

  // UI
  const [search, setSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [qCatFilter, setQCatFilter] = useState("all");
  const [qDiffFilter, setQDiffFilter] = useState("all");
  const [examSearch, setExamSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());

  // Modals
  const [qModal, setQModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [examModal, setExamModal] = useState(false);
  const [qForm, setQForm] = useState({ ...EMPTY_Q });
  const [catForm, setCatForm] = useState({ ...EMPTY_CAT });
  const [examForm, setExamForm] = useState({ ...EMPTY_EXAM });
  const [editingQ, setEditingQ] = useState<QuestionDoc | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "admin") router.replace("/dashboard");
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

  const loadQuestions = useCallback(async (page = 1, cat = "all", diff = "all", q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (cat !== "all") params.set("categoryId", cat);
      if (diff !== "all") params.set("difficulty", diff);
      if (q) params.set("search", q);
      const r = await fetch(`/api/admin/questions?${params}`);
      if (r.ok) {
        const d = await r.json();
        setQuestions(d.questions ?? []);
        setQTotal(d.total ?? 0);
        setQPage(page);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/categories");
      if (r.ok) { const d = await r.json(); setCategories(d.categories ?? []); }
    } catch { /* silent */ }
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

  // Tab data loading
  useEffect(() => {
    if (tab === "overview") loadStats();
    if (tab === "users") { loadUsers(1, userRoleFilter, search); }
    if (tab === "questions") { loadQuestions(1, qCatFilter, qDiffFilter, search); loadCategories(); }
    if (tab === "categories") loadCategories();
    if (tab === "exams") loadExams();
    if (tab === "live") loadLeaderboard();
    setSearch("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Question CRUD ─────────────────────────────────────────────
  async function saveQuestion() {
    if (!qForm.categoryId) { toast("Ангилал сонгоно уу", "err"); return; }
    if (!qForm.question.trim()) { toast("Асуулт оруулна уу", "err"); return; }
    if (qForm.options.some(o => !o.trim())) { toast("4 хариультыг бүгдийг бөглөнө үү", "err"); return; }
    setSubmitting(true);
    try {
      if (editingQ) {
        const r = await fetch("/api/admin/questions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingQ._id, ...qForm }) });
        if (!r.ok) throw new Error();
        toast("Асуулт шинэчлэгдлээ");
      } else {
        const r = await fetch("/api/admin/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(qForm) });
        if (!r.ok) throw new Error();
        toast("Асуулт нэмэгдлээ");
      }
      closeQModal();
      loadQuestions(qPage, qCatFilter, qDiffFilter, search);
    } catch {
      toast("Хадгалах үед алдаа гарлаа", "err");
    }
    setSubmitting(false);
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Энэ асуултыг устгах уу?")) return;
    try {
      const r = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast("Асуулт устгагдлаа");
      loadQuestions(qPage, qCatFilter, qDiffFilter, search);
    } catch {
      toast("Устгах үед алдаа гарлаа", "err");
    }
  }

  function openEditQ(q: QuestionDoc) {
    setEditingQ(q);
    setQForm({
      categoryId: q.categoryId?._id ?? "",
      level: q.level, question: q.question,
      options: q.options?.length === 4 ? q.options : ["", "", "", ""],
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation ?? "",
      difficulty: q.difficulty, xpReward: q.xpReward,
      coinReward: q.coinReward ?? 5,
    });
    setQModal(true);
  }

  function closeQModal() {
    setQModal(false); setEditingQ(null); setQForm({ ...EMPTY_Q });
  }

  // ── Category CRUD ─────────────────────────────────────────────
  async function saveCategory() {
    if (!catForm.name.trim()) { toast("Нэр оруулна уу", "err"); return; }
    setSubmitting(true);
    try {
      if (editingCat) {
        const r = await fetch("/api/admin/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingCat._id, ...catForm }) });
        if (!r.ok) throw new Error();
        toast("Ангилал шинэчлэгдлээ");
      } else {
        const r = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
        if (!r.ok) throw new Error();
        toast("Ангилал нэмэгдлээ");
      }
      closeCatModal();
      loadCategories();
    } catch {
      toast("Хадгалах үед алдаа гарлаа", "err");
    }
    setSubmitting(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Ангилал устгахад холбоотой бүх асуулт устгагдана. Үргэлжлүүлэх үү?")) return;
    try {
      const r = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast("Ангилал устгагдлаа");
      loadCategories();
      if (qCatFilter === id) setQCatFilter("all");
    } catch {
      toast("Устгах үед алдаа гарлаа", "err");
    }
  }

  function openEditCat(c: Category) {
    setEditingCat(c);
    setCatForm({ name: c.name, icon: c.icon ?? "", color: c.color ?? "#4F46E5", totalLevels: c.totalLevels, order: c.order });
    setCatModal(true);
  }

  function closeCatModal() {
    setCatModal(false); setEditingCat(null); setCatForm({ ...EMPTY_CAT });
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
    if (!confirm("Шалгалтыг устгах уу?")) return;
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
      loadUsers(userPage, userRoleFilter, search);
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
      loadUsers(userPage, userRoleFilter, search);
    } catch {
      toast("Алдаа гарлаа", "err");
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Хэрэглэгчийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.")) return;
    try {
      const r = await fetch(`/api/admin/users?userId=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast("Хэрэглэгч устгагдлаа");
      loadUsers(userPage, userRoleFilter, search);
    } catch {
      toast("Устгах үед алдаа гарлаа", "err");
    }
  }

  // ── Filtered data ─────────────────────────────────────────────
  const filteredExams = exams.filter(e =>
    !examSearch || e.title.toLowerCase().includes(examSearch.toLowerCase())
  );

  const NAV: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",   label: "Тойм",              icon: "⊞" },
    { id: "content",    label: "Тоглоомын агуулга", icon: "🎮" },
    { id: "live",       label: "Тэргүүлэгчид",      icon: "🏆" },
    { id: "users",      label: "Хэрэглэгчид",       icon: "👥" },
    { id: "questions",  label: "Асуултын сан",      icon: "❓" },
    { id: "categories", label: "Ангилал",           icon: "📂" },
    { id: "exams",      label: "Шалгалтууд",        icon: "📝" },
  ];

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", color: "#64748B" }}>
      Ачаалж байна…
    </div>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: "Inter", system-ui, -apple-system, sans-serif; background: #F1F5F9; color: #0F172A; font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
        button { font-family: inherit; cursor: pointer; border: 0; }
        input, select, textarea { font-family: inherit; }
        .shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
        .sidebar { position: sticky; top: 0; height: 100vh; background: #fff; border-right: 1px solid #E2E8F0; display: flex; flex-direction: column; }
        .main { min-width: 0; padding: 28px 32px; overflow-y: auto; max-height: 100vh; }
        .brand { padding: 20px 16px 16px; border-bottom: 1px solid #F1F5F9; }
        .brand-title { font-size: 15px; font-weight: 700; color: #0F172A; letter-spacing: -.01em; }
        .brand-sub { font-size: 10px; font-weight: 600; color: #6366F1; text-transform: uppercase; letter-spacing: .08em; margin-top: 1px; }
        .nav { padding: 10px 8px; flex: 1; }
        .nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border-radius: 7px; background: transparent; color: #64748B; font-size: 13.5px; font-weight: 500; text-align: left; transition: all .12s; margin-bottom: 2px; }
        .nav-item:hover { background: #F8FAFC; color: #0F172A; }
        .nav-item.active { background: #EEF2FF; color: #4F46E5; font-weight: 600; }
        .nav-icon { font-size: 15px; width: 20px; text-align: center; }
        .user-area { padding: 12px 14px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 10px; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 700; display: grid; place-items: center; flex-shrink: 0; }
        .signout-btn { font-size: 12px; color: #94A3B8; background: transparent; padding: 4px 8px; border-radius: 5px; border: 1px solid #E2E8F0; transition: all .1s; }
        .signout-btn:hover { color: #DC2626; border-color: #FCA5A5; background: #FEF2F2; }
        .page-header { margin-bottom: 24px; }
        .page-title { font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -.02em; }
        .page-sub { font-size: 13px; color: #64748B; margin-top: 3px; }
        .card { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; }
        .card-head { padding: 14px 18px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .card-head h3 { font-size: 14px; font-weight: 600; color: #0F172A; }
        .card-head .sub { font-size: 12px; color: #94A3B8; margin-top: 1px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 18px; }
        .stat-label { font-size: 12px; font-weight: 500; color: #64748B; }
        .stat-value { font-size: 26px; font-weight: 700; color: #0F172A; margin: 8px 0 4px; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
        .stat-trend { font-size: 12px; color: #94A3B8; }
        .stat-trend.up { color: #16A34A; }
        .toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .spacer { flex: 1; }
        .btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; font-size: 13px; font-weight: 500; background: #fff; color: #374151; border: 1px solid #E2E8F0; border-radius: 7px; transition: all .1s; white-space: nowrap; }
        .btn:hover { background: #F8FAFC; border-color: #CBD5E1; }
        .btn.primary { background: #4F46E5; color: #fff; border-color: #4F46E5; }
        .btn.primary:hover { background: #4338CA; border-color: #4338CA; }
        .btn.danger { color: #DC2626; }
        .btn.danger:hover { background: #FEF2F2; border-color: #FCA5A5; }
        .btn.sm { height: 30px; padding: 0 10px; font-size: 12px; }
        .btn:disabled { opacity: .5; cursor: not-allowed; }
        .input, .select, .textarea { width: 100%; height: 36px; padding: 0 10px; background: #fff; border: 1px solid #E2E8F0; border-radius: 7px; color: #0F172A; font-size: 13px; outline: none; transition: border-color .1s, box-shadow .1s; }
        .textarea { height: auto; padding: 10px; resize: vertical; line-height: 1.5; }
        .input:focus, .select:focus, .textarea:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .label { display: block; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 5px; }
        .field { margin-bottom: 14px; }
        .search-wrap { display: flex; align-items: center; height: 34px; padding: 0 10px; gap: 8px; border: 1px solid #E2E8F0; border-radius: 7px; background: #fff; }
        .search-wrap input { border: 0; outline: none; flex: 1; font-size: 13px; color: #0F172A; background: transparent; }
        .table-wrap { border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: #fff; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: .05em; padding: 10px 16px; text-align: left; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
        .table td { padding: 12px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #F8FAFC; vertical-align: middle; }
        .table tbody tr:last-child td { border-bottom: 0; }
        .table tbody tr:hover td { background: #FAFBFF; }
        .row-actions { display: flex; gap: 4px; opacity: 0; transition: opacity .1s; }
        .table tr:hover .row-actions { opacity: 1; }
        .pager { padding: 10px 16px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94A3B8; }
        .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 5px; }
        .badge.green { background: #ECFDF5; color: #065F46; }
        .badge.red { background: #FEF2F2; color: #991B1B; }
        .badge.amber { background: #FFFBEB; color: #92400E; }
        .badge.blue { background: #EFF6FF; color: #1D4ED8; }
        .badge.gray { background: #F1F5F9; color: #475569; }
        .badge.purple { background: #F5F3FF; color: #6D28D9; }
        .badge.dot::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: grid; place-items: center; z-index: 100; padding: 20px; animation: fadeIn .1s ease; }
        .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.15); animation: pop .12s ease; }
        .modal.wide { max-width: 680px; }
        .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #F1F5F9; position: sticky; top: 0; background: #fff; z-index: 1; }
        .modal-head h2 { font-size: 16px; font-weight: 700; color: #0F172A; }
        .modal-body { padding: 18px 20px; }
        .modal-foot { display: flex; gap: 8px; padding: 14px 20px; border-top: 1px solid #F1F5F9; justify-content: flex-end; position: sticky; bottom: 0; background: #fff; }
        .close-btn { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; background: transparent; color: #94A3B8; font-size: 18px; transition: all .1s; }
        .close-btn:hover { background: #F1F5F9; color: #374151; }
        .empty { padding: 48px 20px; text-align: center; color: #94A3B8; }
        .empty-icon { font-size: 32px; margin-bottom: 10px; }
        .empty-title { font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .empty-sub { font-size: 13px; }
        .loading-row td { text-align: center; padding: 32px; color: #94A3B8; }
        .toast-wrap { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 200; pointer-events: none; }
        .toast { padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; box-shadow: 0 4px 20px rgba(0,0,0,.12); animation: slideIn .2s ease; }
        .toast.ok { background: #0F172A; color: #fff; }
        .toast.err { background: #DC2626; color: #fff; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { from { transform: scale(.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      <div className="shell">
        {/* ── SIDEBAR ─────────────────────────────────── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-title">CyberPhysics</div>
            <div className="brand-sub">Удирдлагын самбар</div>
          </div>
          <nav className="nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </button>
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

              {!stats ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>Ачаалж байна…</div>
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
            <div>
              <div className="page-header">
                <h1 className="page-title">Тоглоомын агуулга</h1>
                <p className="page-sub">
                  Сэдэв → дэд сэдэв (хичээл) → асуулт. Хадгалсны дараа сурагчийн «Давталт» дэлгэцэнд харагдана.
                </p>
              </div>
              <ContentManager />
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
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar">{p.initials}</div>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: "#4F46E5", fontVariantNumeric: "tabular-nums" }}>{p.score.toLocaleString()} XP</td>
                        <td style={{ color: p.streak > 7 ? "#F59E0B" : "#64748B" }}>{p.streak > 0 ? `🔥 ${p.streak} өдөр` : "—"}</td>
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
                  <input placeholder="Нэр, и-мэйл…" value={search}
                    onChange={e => { setSearch(e.target.value); }}
                    onKeyDown={e => { if (e.key === "Enter") loadUsers(1, userRoleFilter, (e.target as HTMLInputElement).value); }}
                  />
                </div>
                <select className="select" style={{ width: 140 }} value={userRoleFilter}
                  onChange={e => { setUserRoleFilter(e.target.value); loadUsers(1, e.target.value, search); }}>
                  <option value="all">Бүх дүр</option>
                  <option value="student">Сурагч</option>
                  <option value="teacher">Багш</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="spacer" />
                <button className="btn" onClick={() => loadUsers(1, userRoleFilter, search)}>Хайх</button>
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
                      <tr className="loading-row"><td colSpan={7}>Ачаалж байна…</td></tr>
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
                        <td style={{ fontWeight: 600, color: "#4F46E5", fontVariantNumeric: "tabular-nums" }}>
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
                  <button className="btn sm" disabled={userPage <= 1} onClick={() => loadUsers(userPage - 1, userRoleFilter, search)}>‹ Өмнөх</button>
                  <button className="btn sm" disabled={userPage * PAGE_SIZE >= userTotal} onClick={() => loadUsers(userPage + 1, userRoleFilter, search)}>Дараах ›</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ QUESTIONS ══════════════════════════════ */}
          {tab === "questions" && (
            <div>
              <div className="page-header">
                <h1 className="page-title">Асуултын сан</h1>
                <p className="page-sub">Нийт {qTotal} асуулт хадгалагдсан</p>
              </div>
              <div className="toolbar">
                <select className="select" style={{ width: 160 }} value={qCatFilter}
                  onChange={e => { setQCatFilter(e.target.value); loadQuestions(1, e.target.value, qDiffFilter, search); }}>
                  <option value="all">Бүх ангилал</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select className="select" style={{ width: 120 }} value={qDiffFilter}
                  onChange={e => { setQDiffFilter(e.target.value); loadQuestions(1, qCatFilter, e.target.value, search); }}>
                  <option value="all">Бүх түвшин</option>
                  <option value="easy">Хялбар</option>
                  <option value="medium">Дунд</option>
                  <option value="hard">Хэцүү</option>
                </select>
                <div className="search-wrap" style={{ width: 220 }}>
                  <span style={{ color: "#94A3B8" }}>⌕</span>
                  <input placeholder="Асуулт хайх…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") loadQuestions(1, qCatFilter, qDiffFilter, (e.target as HTMLInputElement).value); }}
                  />
                </div>
                <button className="btn" onClick={() => loadQuestions(1, qCatFilter, qDiffFilter, search)}>Хайх</button>
                <div className="spacer" />
                <button className="btn primary" onClick={() => { setEditingQ(null); setQForm({ ...EMPTY_Q }); setQModal(true); }}>+ Асуулт нэмэх</button>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Асуулт</th>
                      <th style={{ width: 140 }}>Ангилал</th>
                      <th style={{ width: 60 }}>Lvl</th>
                      <th style={{ width: 90 }}>Хүнд</th>
                      <th style={{ width: 60 }}>XP</th>
                      <th style={{ width: 100, textAlign: "right" }}>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr className="loading-row"><td colSpan={6}>Ачаалж байна…</td></tr>
                    ) : questions.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94A3B8" }}>Асуулт олдсонгүй</td></tr>
                    ) : questions.map(q => (
                      <tr key={q._id}>
                        <td style={{ maxWidth: 360 }}>
                          <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</div>
                        </td>
                        <td style={{ color: "#64748B" }}>{q.categoryId?.name ?? "—"}</td>
                        <td style={{ color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>{q.level}</td>
                        <td>
                          <span className={`badge ${q.difficulty === "easy" ? "green" : q.difficulty === "hard" ? "red" : "amber"}`}>
                            {q.difficulty === "easy" ? "Хялбар" : q.difficulty === "hard" ? "Хэцүү" : "Дунд"}
                          </span>
                        </td>
                        <td style={{ color: "#4F46E5", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>+{q.xpReward}</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                            <button className="btn sm" onClick={() => openEditQ(q)}>Засах</button>
                            <button className="btn sm danger" onClick={() => deleteQuestion(q._id)}>Устгах</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pager">
                  <span>{questions.length ? `${(qPage - 1) * PAGE_SIZE + 1}–${Math.min(qPage * PAGE_SIZE, qTotal)} / ${qTotal}` : "0"}</span>
                  <div className="spacer" />
                  <button className="btn sm" disabled={qPage <= 1} onClick={() => loadQuestions(qPage - 1, qCatFilter, qDiffFilter, search)}>‹ Өмнөх</button>
                  <button className="btn sm" disabled={qPage * PAGE_SIZE >= qTotal} onClick={() => loadQuestions(qPage + 1, qCatFilter, qDiffFilter, search)}>Дараах ›</button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CATEGORIES ═════════════════════════════ */}
          {tab === "categories" && (
            <div>
              <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h1 className="page-title">Ангилал</h1>
                  <p className="page-sub">{categories.length} ангилал бүртгэлтэй</p>
                </div>
                <button className="btn primary" onClick={() => { setEditingCat(null); setCatForm({ ...EMPTY_CAT }); setCatModal(true); }}>+ Ангилал нэмэх</button>
              </div>
              {categories.length === 0 ? (
                <div className="card"><div className="empty"><div className="empty-icon">📂</div><div className="empty-title">Ангилал байхгүй байна</div><div className="empty-sub">Дээрх товчоор анхны ангилалаа нэмнэ үү</div></div></div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {categories.map(c => (
                    <div key={c._id} className="card">
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}18`, color: c.color, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700 }}>
                            {c.icon?.trim() || c.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className={`badge ${c.isActive ? "green dot" : "gray"}`}>{c.isActive ? "Идэвхтэй" : "Идэвхгүй"}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14 }}>{c.totalLevels} level · Дараалал {c.order}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn sm" style={{ flex: 1 }} onClick={() => openEditCat(c)}>Засах</button>
                          <button className="btn sm danger" onClick={() => deleteCategory(c._id)}>Устгах</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      <div className="empty"><div className="empty-icon">📝</div><div className="empty-title">{examSearch ? "Тохирох шалгалт олдсонгүй" : "Шалгалт байхгүй байна"}</div></div>
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
                              <td style={{ color: "#4F46E5", fontWeight: 600 }}>{exam.questions?.length ?? 0}</td>
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
                                  <td style={{ fontWeight: 600, color: "#4F46E5", fontVariantNumeric: "tabular-nums" }}>{a.score}/{a.totalQuestions}</td>
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
        </main>
      </div>

      {/* ── QUESTION MODAL ─────────────────────────── */}
      {qModal && (
        <div className="overlay" onClick={closeQModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingQ ? "Асуулт засах" : "Шинэ асуулт нэмэх"}</h2>
              <button className="close-btn" onClick={closeQModal}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px", gap: 10, marginBottom: 14 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Ангилал *</label>
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
                  <label className="label">Хүндвэрлэл</label>
                  <select className="select" value={qForm.difficulty} onChange={e => setQForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="easy">Хялбар</option>
                    <option value="medium">Дунд</option>
                    <option value="hard">Хэцүү</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Асуулт *</label>
                <textarea className="textarea" rows={3} placeholder="Асуултаа оруулна уу" value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Хариултууд — зөв хариулт сонгоно уу *</label>
                {qForm.options.map((o, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <input type="radio" name="correct" checked={qForm.correctIndex === i} onChange={() => setQForm(f => ({ ...f, correctIndex: i }))} style={{ accentColor: "#4F46E5", width: 15, height: 15, flexShrink: 0 }} />
                    <span style={{ width: 22, height: 22, borderRadius: 5, background: qForm.correctIndex === i ? "#4F46E5" : "#F1F5F9", color: qForm.correctIndex === i ? "#fff" : "#64748B", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{"ABCD"[i]}</span>
                    <input className="input" placeholder={`Хариулт ${"ABCD"[i]}`} value={o} onChange={e => setQForm(f => ({ ...f, options: f.options.map((v, k) => k === i ? e.target.value : v) }))} style={{ borderColor: qForm.correctIndex === i ? "#6366F1" : "#E2E8F0" }} />
                  </label>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", gap: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Тайлбар</label>
                  <input className="input" placeholder="Зөв хариултын тайлбар" value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">XP</label>
                  <input type="number" className="input" value={qForm.xpReward} min={0} onChange={e => setQForm(f => ({ ...f, xpReward: +e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Coin</label>
                  <input type="number" className="input" value={qForm.coinReward} min={0} onChange={e => setQForm(f => ({ ...f, coinReward: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={closeQModal}>Болих</button>
              <button className="btn primary" disabled={submitting} onClick={saveQuestion}>{submitting ? "Хадгалж байна…" : editingQ ? "Хадгалах" : "Нэмэх"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ─────────────────────────── */}
      {catModal && (
        <div className="overlay" onClick={closeCatModal}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingCat ? "Ангилал засах" : "Шинэ ангилал нэмэх"}</h2>
              <button className="close-btn" onClick={closeCatModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="label">Нэр *</label>
                <input className="input" placeholder="Жишээ: Цахилгаан" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Дүрс тэмдэг</label>
                  <input className="input" placeholder="⚡" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Өнгө</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} style={{ width: 36, height: 36, padding: 2, border: "1px solid #E2E8F0", borderRadius: 7, cursor: "pointer" }} />
                    <input className="input" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Нийт level</label>
                  <input type="number" className="input" value={catForm.totalLevels} min={1} onChange={e => setCatForm(f => ({ ...f, totalLevels: +e.target.value }))} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Дараалал</label>
                  <input type="number" className="input" value={catForm.order} min={0} onChange={e => setCatForm(f => ({ ...f, order: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={closeCatModal}>Болих</button>
              <button className="btn primary" disabled={submitting || !catForm.name.trim()} onClick={saveCategory}>{submitting ? "Хадгалж байна…" : editingCat ? "Хадгалах" : "Нэмэх"}</button>
            </div>
          </div>
        </div>
      )}

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
                          <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt.id} onChange={() => updateExamQ(q.id, "correctAnswer", opt.id)} style={{ accentColor: "#4F46E5", width: 14, height: 14, flexShrink: 0 }} />
                          <span style={{ width: 22, height: 22, borderRadius: 5, background: q.correctAnswer === opt.id ? "#4F46E5" : "#E2E8F0", color: q.correctAnswer === opt.id ? "#fff" : "#64748B", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{opt.id}</span>
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

      {/* ── TOASTS ──────────────────────────────────── */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}
