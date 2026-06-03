'use client';

import { useState } from 'react';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { StatusAlert } from '@/components/ui/status-alert';

export function SeedPhysicsPanel({ onSeeded }: { onSeeded?: () => void }) {
  const { confirm } = useConfirm();
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
    <div className="seed-panel card">
      <div className="seed-panel-head">
        <AdminIcon name="book" size={18} />
        <div>
          <h3>Физикийн жишээ агуулга</h3>
          <p>3 сэдэв, 7 хичээл, 70 асуулт, 2 шалгалт</p>
        </div>
      </div>
      <div className="seed-panel-actions">
        <button type="button" className="btn primary" disabled={busy} onClick={() => run(false)}>
          {busy ? 'Суулгаж байна…' : 'Жишээ агуулга суулгах'}
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: 'Дахин суулгах',
              description: 'Бүх сэдэв, хичээлийг устгаад дахин суулгах уу?',
              confirmLabel: 'Тийм, суулгах',
              destructive: true,
            });
            if (ok) void run(true);
          }}
        >
          Цэвэрлээд дахин суулгах
        </button>
      </div>
      {msg && <StatusAlert variant="success">{msg}</StatusAlert>}
      {err && <StatusAlert variant="error">{err}</StatusAlert>}
    </div>
  );
}
