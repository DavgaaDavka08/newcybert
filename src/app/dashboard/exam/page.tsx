"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";

interface Exam {
  _id: string; title: string; description?: string;
  duration: number; questions: { id: string }[];
  hasAttempt: boolean; createdAt: string;
}

export default function ExamListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/exam/exams")
      .then(r => r.json())
      .then(data => { setExams(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      Ачаалж байна...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit", padding: "6px 10px", borderRadius: 8, transition: "background .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = T.sidebarHover)}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <Ic n="chevLeft" size={16} /> Буцах
          </button>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Шалгалтууд</div>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>
          Сайн уу, {session?.user?.name?.split(" ")[0]}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(120deg, #1e3a8a 0%, #4F46E5 100%)", borderRadius: 18, padding: "24px 28px", marginBottom: 28, color: "#fff", boxShadow: "0 8px 32px rgba(79,70,229,0.25)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Шалгалтын систем</div>
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Шалгалт өгч мэдлэгээ шалга</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>Хугацаатай асуултуудад хариулж, үр дүнгээ шууд харна уу.</div>
        </div>

        {/* Exam list */}
        {exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: T.muted }}>
            <Ic n="task" size={40} color={T.muted} style={{ marginBottom: 12, opacity: 0.45 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Шалгалт байхгүй байна</div>
            <div style={{ fontSize: 13 }}>Admin шинэ шалгалт нэмэхийг хүлээнэ үү</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {exams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} onStart={() => router.push(`/dashboard/exam/${exam._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamCard({ exam, onStart }: { exam: Exam; onStart: () => void }) {
  const [hov, setHov] = useState(false);
  const done = exam.hasAttempt;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: "#fff", borderRadius: 14,
      border: `1.5px solid ${hov && !done ? "#4F46E5" : T.border}`,
      padding: "20px 22px",
      boxShadow: hov ? "0 4px 20px rgba(79,70,229,0.12)" : T.shadow,
      transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: done ? T.greenLight : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            <Ic n={done ? "check" : "task"} size={18} color={done ? T.green : T.blue} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{exam.title}</div>
            {exam.description && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{exam.description}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, paddingLeft: 46 }}>
          <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="history" size={13} color={T.muted} /> {exam.duration} мин
          </span>
          <span style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
            <Ic n="task" size={13} color={T.muted} /> {exam.questions?.length ?? 0} асуулт
          </span>
        </div>
      </div>

      {done ? (
        <div style={{ background: T.greenLight, color: T.green, padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${T.green}30` }}>
          ✓ Өгсөн
        </div>
      ) : (
        <button onClick={onStart} style={{
          background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer",
          fontFamily: "Plus Jakarta Sans, sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
          transition: "transform .15s",
          transform: hov ? "translateY(-1px)" : "none",
        }}>
          Эхлэх →
        </button>
      )}
    </div>
  );
}
