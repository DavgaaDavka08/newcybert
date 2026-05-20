"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";
import { BackButton } from "@/components/ui/BackButton";

interface VideoRow {
  _id: string;
  title: string;
  description?: string;
  mediaType?: "video" | "pdf";
  url: string;
  thumbnailUrl?: string;
  durationSec?: number;
  uploadedByName?: string;
  createdAt: string;
}

function fmtDur(sec?: number) {
  if (sec == null || !Number.isFinite(sec)) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideosPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const role = session?.user?.role;
  const canManage = role === "teacher" || role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(() => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVideos(data);
          setCompletedIds(new Set());
        } else {
          setVideos(data.videos ?? []);
          setCompletedIds(new Set(data.completedIds ?? []));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
  }, [status, load]);

  const markComplete = useCallback(
    async (videoId: string) => {
      if (completedIds.has(videoId)) return;
      try {
        const res = await fetch(`/api/videos/${videoId}/complete`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          if (res.status !== 400) setToast(data.error ?? "Алдаа гарлаа");
          return;
        }
        setCompletedIds((prev) => new Set(prev).add(videoId));
        if (data.xpAwarded > 0) {
          setToast(data.message ?? `+${data.xpAwarded} XP`);
          const level = Math.floor((data.totalXp ?? 0) / 200) + 1;
          await update({ xp: data.totalXp, level });
        }
      } catch {
        setToast("Холболтын алдаа");
      }
    },
    [completedIds, update],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (status === "loading" || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.muted,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        Ачаалж байна...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            background: "#065F46",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackButton href="/dashboard" label="Буцах" />
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Ic n="video" size={18} color={T.blue} />
            Видео хичээл
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canManage && (
            <button
              type="button"
              onClick={() => router.push(role === "admin" ? "/admin" : "/dashboard/teacher/videos")}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: T.blue,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ic n="plus" size={14} color="#fff" />
              Бичлэг оруулах
            </button>
          )}
          <div style={{ fontSize: 13, color: T.muted }}>
            Сайн уу, {session?.user?.name?.split(" ")[0]}
            {session?.user?.xp != null && (
              <span style={{ marginLeft: 8, color: T.blue, fontWeight: 700 }}>{session.user.xp} XP</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            background: "linear-gradient(125deg, #0f172a 0%, #2563eb 100%)",
            borderRadius: 18,
            padding: "24px 28px",
            marginBottom: 28,
            color: "#fff",
            boxShadow: "0 8px 32px rgba(37,99,235,0.22)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.65)",
              marginBottom: 6,
            }}
          >
            Физикийн хичээл
          </div>
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Багшийн видео бичлэгүүд</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)" }}>
            Хичээл үзэж дуусгавал +10 XP олгоно.
          </div>
        </div>

        {videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0", color: T.muted }}>
            <div style={{ marginBottom: 12, opacity: 0.45 }}>
              <Ic n="video" size={40} color={T.muted} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Одоогоор хичээл байхгүй</div>
            <div style={{ fontSize: 13 }}>
              {canManage ? "Админ самбар эсвэл дээд талын товчоор оруулна уу." : "Багш нар хичээл оруулахыг хүлээнэ үү."}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {videos.map((v) => (
              <LessonCard
                key={v._id}
                video={v}
                completed={completedIds.has(v._id)}
                onComplete={() => markComplete(v._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonCard({
  video,
  completed,
  onComplete,
}: {
  video: VideoRow;
  completed: boolean;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isPdf = video.mediaType === "pdf";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${completed ? "#86EFAC" : T.border}`,
        overflow: "hidden",
        boxShadow: T.shadow,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          background: isPdf ? "#f1f5f9" : "#0f172a",
          cursor: "pointer",
        }}
        onClick={() => setOpen(true)}
      >
        {isPdf ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Ic n="file" size={40} color={T.muted} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>PDF</span>
          </div>
        ) : video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg,#1e293b,#334155)",
            }}
          >
            <Ic n="video" size={48} color="rgba(255,255,255,0.35)" />
          </div>
        )}
        {!isPdf && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ic n="play" size={22} color={T.blue} />
            </div>
          </div>
        )}
        {video.durationSec != null && !isPdf && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(0,0,0,0.72)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            {fmtDur(video.durationSec)}
          </div>
        )}
        {completed && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "#059669",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            Дууссан
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, lineHeight: 1.35 }}>{video.title}</div>
        {video.description && (
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.45, flex: 1 }}>{video.description}</div>
        )}
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
          {video.uploadedByName && <span>{video.uploadedByName}</span>}
          {!completed && <span style={{ color: T.blue, fontWeight: 700 }}>+10 XP</span>}
        </div>
      </div>
      {open &&
        (isPdf ? (
          <PdfModal video={video} completed={completed} onComplete={onComplete} onClose={() => setOpen(false)} />
        ) : (
          <VideoModal video={video} completed={completed} onComplete={onComplete} onClose={() => setOpen(false)} />
        ))}
    </div>
  );
}

function VideoModal({
  video,
  completed,
  onComplete,
  onClose,
}: {
  video: VideoRow;
  completed: boolean;
  onComplete: () => void;
  onClose: () => void;
}) {
  const doneRef = useRef(false);

  function handleEnded() {
    if (doneRef.current || completed) return;
    doneRef.current = true;
    onComplete();
  }

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15,23,42,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        style={{
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          background: "#0f172a",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, paddingRight: 12 }}>
            {video.title}
            {completed ? (
              <span style={{ marginLeft: 10, fontSize: 12, color: "#6EE7B7" }}>Дууссан</span>
            ) : (
              <span style={{ marginLeft: 10, fontSize: 12, color: "#93C5FD" }}>Дуусвал +10 XP</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              width: 36,
              height: 36,
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic n="xCircle" size={18} color="#fff" />
          </button>
        </div>
        <div style={{ aspectRatio: "16/9", background: "#000" }}>
          <video
            src={video.url}
            controls
            autoPlay
            playsInline
            onEnded={handleEnded}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

function PdfModal({
  video,
  completed,
  onComplete,
  onClose,
}: {
  video: VideoRow;
  completed: boolean;
  onComplete: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15,23,42,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        style={{
          width: "min(920px, 100%)",
          height: "min(85vh, 800px)",
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{video.title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: T.sidebarHover,
              width: 36,
              height: 36,
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic n="xCircle" size={18} />
          </button>
        </div>
        <object
          data={`/api/videos/${video._id}/pdf`}
          type="application/pdf"
          title={video.title}
          style={{ flex: 1, width: "100%", border: "none", minHeight: 400 }}
        >
          <iframe
            src={`/api/videos/${video._id}/pdf`}
            title={video.title}
            style={{ width: "100%", height: "100%", minHeight: 400, border: "none" }}
          />
        </object>
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: T.blue, fontWeight: 600, alignSelf: "center", marginRight: "auto" }}
          >
            Шинэ цонхонд нээх
          </a>
          {!completed && (
            <button
              type="button"
              onClick={onComplete}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: T.blue,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Уншлаа — +10 XP
            </button>
          )}
          {completed && (
            <span style={{ fontSize: 13, color: "#059669", fontWeight: 700, alignSelf: "center" }}>Дууссан</span>
          )}
        </div>
      </div>
    </div>
  );
}
