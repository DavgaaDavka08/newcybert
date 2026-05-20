'use client';

import { useState } from 'react';

export function SeedPhysicsPanel({ onSeeded }: { onSeeded?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(clear: boolean) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch('/api/admin/seed-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear }),
      });
      const d = await r.json();
      if (!r.ok || d.ok === false) {
        setErr(d.message || d.error || 'Алдаа гарлаа');
        return;
      }
      setMsg(d.message || 'Амжилттай');
      onSeeded?.();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20, padding: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>Физикийн жишээ агуулга</h3>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
        3 сэдэв, 7 хичээл, 70 асуулт, 2 шалгалт — тоглоом болон шалгалтын хэсэгт шууд харагдана.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn primary" disabled={busy} onClick={() => run(false)}>
          {busy ? 'Суулгаж байна…' : 'Жишээ агуулга суулгах'}
        </button>
        <button type="button" className="btn danger" disabled={busy} onClick={() => {
          if (confirm('Бүх сэдэв, хичээлийг устгаад дахин суулгах уу?')) void run(true);
        }}>
          Цэвэрлээд дахин суулгах
        </button>
      </div>
      {msg && <div className="alert-box success" style={{ marginTop: 12 }}>{msg}</div>}
      {err && <div className="alert-box error" style={{ marginTop: 12 }}>{err}</div>}
    </div>
  );
}
