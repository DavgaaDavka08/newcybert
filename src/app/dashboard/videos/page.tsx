"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";

interface VideoRow {
  _id: string;
  title: string;
  description?: string;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const role = session?.user?.role;
  const canManage = role === "teacher" || role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data) => {
        setVideos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

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
          <button
            onClick={() => router.push("/dashboard")}
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.muted,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontFamily: "inherit",
              padding: "6px 10px",
              borderRadius: 8,
              transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.sidebarHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <Ic n="chevLeft" size={16} /> Буцах
          </button>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>🎬 Видео хичээл</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canManage && (
            <button
              type="button"
              onClick={() => router.push("/dashboard/teacher/videos")}
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
                boxShadow: `0 2px 10px ${T.blue}44`,
              }}
            >
              <Ic n="plus" size={14} color="#fff" />
              Бичлэг оруулах
            </button>
          )}
          <div style={{ fontSize: 13, color: T.muted }}>
            Сайн уу, {session?.user?.name?.split(" ")[0]}
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
            Хичээлүүдийг үзэж, давтаж суралцаарай.
          </div>
        </div>

        {videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0", color: T.muted }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Одоогоор видео байхгүй</div>
            <div style={{ fontSize: 13 }}>
              {canManage ? "Дээд талын товчоор эхний бичлэгээ оруулна уу." : "Багш нар хичээл оруулахыг хүлээнэ үү."}
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
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: VideoRow }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${T.border}`,
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
          background: "#0f172a",
          cursor: "pointer",
        }}
        onClick={() => setOpen(true)}
      >
        {video.thumbnailUrl ? (
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
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <Ic n="play" size={22} color={T.blue} />
          </div>
        </div>
        {video.durationSec != null && (
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
      </div>
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, lineHeight: 1.35 }}>{video.title}</div>
        {video.description && (
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.45, flex: 1 }}>{video.description}</div>
        )}
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
          {video.uploadedByName && <span>{video.uploadedByName}</span>}
        </div>
      </div>
      {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
    </div>
  );
}

function VideoModal({ video, onClose }: { video: VideoRow; onClose: () => void }) {
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
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, paddingRight: 12 }}>{video.title}</div>
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
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
