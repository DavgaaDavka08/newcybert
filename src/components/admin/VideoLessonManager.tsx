"use client";

import { useCallback, useEffect, useState } from "react";
import { uploadToCloudinary, cloudinaryVideoThumbnail } from "@/lib/cloudinary-upload";
import { AdminIcon } from "@/components/admin/AdminIcon";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBusy, setEditBusy] = useState(false);

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

  function startEdit(v: LessonRow) {
    setEditingId(v._id);
    setEditTitle(v.title);
    setEditDesc(v.description ?? "");
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return;
    setEditBusy(true);
    try {
      const r = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d as { error?: string }).error || "Хадгалахад алдаа");
      setEditingId(null);
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setEditBusy(false);
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
        <p className="page-sub">Сурагчийн «Видео хичээл» хэсэгт харагдана</p>
      </div>

      <div className="help-banner" style={{ marginBottom: 20 }}>
        <div className="help-banner-icon"><AdminIcon name="video" size={22} /></div>
        <div>
          <h3>Байршуулах дараалал</h3>
          <p>
            Төрөл сонгох → гарчиг, тайлбар → файл → <strong>Илгээх</strong>. Видео ихдээ 100MB хүртэл
            (төлөвлөгөөнөөс хамаарна).
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div className="media-upload-tabs">
          {(["video", "pdf"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`media-upload-tab${mediaType === t ? " active" : ""}`}
              onClick={() => { setMediaType(t); setFile(null); setErr(null); }}
            >
              <strong>{t === "video" ? "Видео" : "PDF"}</strong>
              <span>{t === "video" ? "Бичлэг, тайлбар" : "Баримт бичиг"}</span>
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
          {err && <div className="alert-box error">{err}</div>}
          {ok && <div style={{ padding: 10, borderRadius: 8, background: "#ECFDF5", color: "#065F46", fontSize: 13, marginBottom: 12 }}>{ok}</div>}
          <button type="submit" className="btn primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Байршуулж байна…" : mediaType === "video" ? "Видео илгээх" : "PDF илгээх"}
          </button>
        </form>
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
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v._id}>
                    {editingId === v._id ? (
                      <td colSpan={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
                          <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Гарчиг" />
                          <textarea className="textarea" rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Тайлбар" />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" className="btn sm primary" disabled={editBusy} onClick={() => saveEdit(v._id)}>
                              {editBusy ? "…" : "Хадгалах"}
                            </button>
                            <button type="button" className="btn sm" onClick={() => setEditingId(null)}>Болих</button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
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
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button type="button" className="btn sm" style={{ marginRight: 6 }} onClick={() => startEdit(v)}>Засах</button>
                          <button type="button" className="btn sm danger" onClick={() => onDelete(v._id)}>Устгах</button>
                        </td>
                      </>
                    )}
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
