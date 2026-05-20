"use client";

import { useCallback, useEffect, useState } from "react";
import { uploadToCloudinary, cloudinaryVideoThumbnail } from "@/lib/cloudinary-upload";

interface LessonRow {
  _id: string;
  title: string;
  description?: string;
  mediaType?: "video" | "pdf";
  url: string;
  thumbnailUrl?: string;
  uploadedByName?: string;
  createdAt: string;
}

export function VideoLessonManager() {
  const [mediaType, setMediaType] = useState<"video" | "pdf">("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [list, setList] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : (data as { videos?: LessonRow[] }).videos ?? [];
        setList(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (!file) {
      setErr(mediaType === "video" ? "Видео файл сонгоно уу" : "PDF файл сонгоно уу");
      return;
    }
    if (!title.trim()) {
      setErr("Гарчиг оруулна уу");
      return;
    }

    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, mediaType);
      const secureUrl = up.secure_url as string | undefined;
      const publicId = up.public_id as string | undefined;
      if (!secureUrl || !publicId) throw new Error("Cloudinary хариу буруу байна");

      const thumbnailUrl =
        mediaType === "video" ? cloudinaryVideoThumbnail(publicId) : undefined;

      const save = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          mediaType,
          publicId,
          url: secureUrl,
          thumbnailUrl,
          durationSec: mediaType === "video" && typeof up.duration === "number" ? up.duration : undefined,
          width: typeof up.width === "number" ? up.width : undefined,
          height: typeof up.height === "number" ? up.height : undefined,
        }),
      });
      const saved = await save.json().catch(() => ({}));
      if (!save.ok) throw new Error((saved as { error?: string }).error || "Хадгалахад алдаа");

      setTitle("");
      setDescription("");
      setFile(null);
      setOk(mediaType === "video" ? "Видео амжилттай нэмэгдлээ" : "PDF амжилттай нэмэгдлээ");
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Устгах уу?")) return;
    const r = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (r.ok) load();
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title">Видео & PDF хичээл</h1>
        <p className="page-sub">Cloudinary ({process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? "—"}) руу байршуулна</p>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["video", "pdf"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setMediaType(t); setFile(null); }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: mediaType === t ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                background: mediaType === t ? "#EEF2FF" : "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t === "video" ? "Видео" : "PDF"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label className="label">Гарчиг *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Жишээ: Цахилгаан гүйдэл" />
          </div>
          <div className="field">
            <label className="label">Тайлбар</label>
            <textarea className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Товч тайлбар" />
          </div>
          <div className="field">
            <label className="label">{mediaType === "video" ? "Видео файл *" : "PDF файл *"}</label>
            <input
              type="file"
              accept={mediaType === "video" ? "video/*" : "application/pdf,.pdf"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ fontSize: 13 }}
            />
            {file && (
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
          {err && <div style={{ padding: 10, borderRadius: 8, background: "#FEF2F2", color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{err}</div>}
          {ok && <div style={{ padding: 10, borderRadius: 8, background: "#ECFDF5", color: "#065F46", fontSize: 13, marginBottom: 12 }}>{ok}</div>}
          <button type="submit" className="btn primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Байршуулж байна…" : "Cloudinary руу илгээх"}
          </button>
        </form>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, lineHeight: 1.5 }}>
          Upload preset нь {mediaType === "video" ? "video" : "raw/PDF"} зөвшөөрсөн байх ёстой.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Бүх хичээлүүд</h3>
            <div className="sub">{list.length} бичлэг</div>
          </div>
        </div>
        {loading ? (
          <div className="empty"><div className="empty-sub">Ачаалж байна…</div></div>
        ) : list.length === 0 ? (
          <div className="empty">
            <div className="empty-title">Хичээл байхгүй</div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Гарчиг</th>
                  <th style={{ width: 80 }}>Төрөл</th>
                  <th style={{ width: 120 }}>Огноо</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.title}</div>
                      {v.uploadedByName && <div style={{ fontSize: 11, color: "#94A3B8" }}>{v.uploadedByName}</div>}
                    </td>
                    <td>
                      <span className={`badge ${v.mediaType === "pdf" ? "amber" : "blue"}`}>
                        {v.mediaType === "pdf" ? "PDF" : "Видео"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#94A3B8" }}>{new Date(v.createdAt).toLocaleDateString("mn-MN")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button type="button" className="btn sm danger" onClick={() => onDelete(v._id)}>Устгах</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
