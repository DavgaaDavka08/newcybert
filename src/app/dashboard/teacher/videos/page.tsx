"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { T } from "@/styles/tokens";
import { Ic } from "@/components/ui/Icon";

interface VideoRow {
  _id: string;
  title: string;
  description?: string;
  url: string;
  createdAt: string;
}

import { uploadToCloudinary } from "@/lib/cloudinary-upload";

export default function TeacherVideosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState<VideoRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadMine = useCallback(() => {
    fetch("/api/videos?mine=1")
      .then((r) => r.json())
      .then((data) => {
        setMine(Array.isArray(data) ? data : []);
        setLoadingList(false);
      })
      .catch(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (role !== "teacher" && role !== "admin") {
      router.replace("/dashboard/videos");
      return;
    }
    loadMine();
  }, [status, role, router, loadMine]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!file) {
      setErr("Видео файл сонгоно уу");
      return;
    }
    if (!title.trim()) {
      setErr("Гарчиг оруулна уу");
      return;
    }
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, "video");
      const secureUrl = up.secure_url as string | undefined;
      const publicId = up.public_id as string | undefined;
      if (!secureUrl || !publicId) {
        throw new Error("Cloudinary хариу буруу байна");
      }
      const duration = typeof up.duration === "number" ? up.duration : undefined;
      const width = typeof up.width === "number" ? up.width : undefined;
      const height = typeof up.height === "number" ? up.height : undefined;

      let thumbnailUrl: string | undefined;
      if (publicId) {
        const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
        if (cloud) {
          thumbnailUrl = `https://res.cloudinary.com/${cloud}/video/upload/so_1/${publicId}.jpg`;
        }
      }

      const save = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          mediaType: "video",
          publicId,
          url: secureUrl,
          thumbnailUrl: (up.thumbnailUrl as string | undefined) ?? thumbnailUrl,
          durationSec: duration,
          width,
          height,
        }),
      });
      const saved = await save.json().catch(() => ({}));
      if (!save.ok) {
        throw new Error((saved as { error?: string }).error || "Хадгалахад алдаа");
      }
      setTitle("");
      setDescription("");
      setFile(null);
      loadMine();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Энэ бичлэгийн бүртгэлийг устгах уу? (Cloudinary файл өөрөөр үлдэнэ)")) return;
    const r = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (r.ok) loadMine();
  }

  if (status === "loading") {
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

  if (status !== "authenticated") return null;

  if (role !== "teacher" && role !== "admin") {
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
        Шилжүүлж байна...
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
            type="button"
            onClick={() => router.push("/dashboard/videos")}
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
            }}
          >
            <Ic n="chevLeft" size={16} /> Видео жагсаалт
          </button>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Бичлэг оруулах</div>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>{session?.user?.name}</div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 24px 48px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: `1px solid ${T.border}`,
            padding: "22px 24px",
            boxShadow: T.shadow,
            marginBottom: 28,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 4 }}>Шинэ видео</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 18, lineHeight: 1.5 }}>
            Файл Cloudinary руу шууд орно. Cloudinary дээр <strong>upload preset</strong> нь видео (resource type video)
            зөвшөөрсөн байх ёстой. Одоогийн preset зөвхөн зураг бол алдаа гарна — шинэ preset үүсгээрэй.
          </div>
          <form onSubmit={onSubmit}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 6 }}>
              Гарчиг
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Жишээ: Цахилгаан гүйдэл"
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                fontSize: 14,
                marginBottom: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 6 }}>
              Тайлбар
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Товч агуулга"
              rows={3}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                fontSize: 13,
                marginBottom: 14,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 6 }}>
              Видео файл
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ marginBottom: 16, fontSize: 13 }}
            />
            {file && (
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
                Сонгогдсон: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            {err && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: T.redLight,
                  color: T.red,
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: busy ? T.borderMd : T.blue,
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                cursor: busy ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {busy ? "Байршуулж байна..." : "Cloudinary руу илгээх"}
            </button>
          </form>
        </div>

        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 12 }}>Миний бичлэгүүд</div>
        {loadingList ? (
          <div style={{ color: T.muted, fontSize: 13 }}>Ачаалж байна...</div>
        ) : mine.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 13 }}>Одоогоор бичлэг алга.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mine.map((v) => (
              <div
                key={v._id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{v.title}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                    {new Date(v.createdAt).toLocaleString("mn-MN")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.blue,
                      textDecoration: "none",
                    }}
                  >
                    Нээх
                  </a>
                  <button
                    type="button"
                    onClick={() => onDelete(v._id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: `1px solid ${T.red}`,
                      background: T.redLight,
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.red,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Устгах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
