'use client';

import React, { useEffect, useState } from 'react';
import { T } from '@/styles/tokens';
import type { GameTopic } from '@/lib/game-data';
import { LEVELS_PER_TOPIC } from '@/lib/game-data';

type LessonRow = { title: string; type: string; xp: number; coins: number };

const TYPES = ['lesson', 'quiz', 'lab', 'boss', 'review'] as const;

interface Props {
  onSaved: () => void;
}

export function GamePathAdminPanel({ onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState<GameTopic[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/game-path');
      if (!r.ok) throw new Error('Ачаалахад алдаа');
      const d = await r.json();
      setTopics(d.topics ?? []);
      setLessons(
        (() => {
          let les = (d.lessonNodes ?? []).map((n: LessonRow) => ({
            title: n.title ?? '',
            type: TYPES.includes(n.type as (typeof TYPES)[number]) ? n.type : 'lesson',
            xp: Number(n.xp) || 10,
            coins: Number(n.coins) || 5,
          }));
          let i = les.length;
          while (les.length < LEVELS_PER_TOPIC) {
            les.push({ title: `Давталт ${i + 1}`, type: 'lesson', xp: 10, coins: 5 });
            i++;
          }
          return les.slice(0, LEVELS_PER_TOPIC);
        })()
      );
    } catch {
      setErr('Өгөгдөл ачаалагдсангүй');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch('/api/admin/game-path', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topics.map((t, i) => ({ ...t, order: i })),
          lessonNodes: lessons.slice(0, LEVELS_PER_TOPIC),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Хадгалахад алдаа');
      onSaved();
      setOpen(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 18px',
          borderRadius: 99,
          border: `2px solid ${T.amber}`,
          background: 'rgba(15,23,42,0.92)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 12,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
      >
        {open ? '▼ Зам хаах' : '⚙️ Админ: тоглоомын зам'}
      </button>

      {open && (
        <div
          style={{
            marginTop: 52,
            maxHeight: 'min(70vh, 560px)',
            overflow: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto',
            maxWidth: 720,
            background: '#0f172a',
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
          }}
        >
          {loading ? (
            <div style={{ color: T.muted, textAlign: 'center', padding: 24 }}>Ачаалж байна…</div>
          ) : (
            <>
              {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 10 }}>{err}</div>}
              <div style={{ fontWeight: 800, color: '#fff', marginBottom: 12, fontSize: 14 }}>Сэдвүүд (дараалал)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {topics.map((t, i) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 90px 36px', gap: 6, alignItems: 'center' }}>
                    <input
                      value={t.id}
                      onChange={e => setTopics(prev => prev.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))}
                      style={inp}
                      placeholder="id"
                    />
                    <input
                      value={t.name}
                      onChange={e => setTopics(prev => prev.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      style={inp}
                      placeholder="Нэр"
                    />
                    <input
                      value={t.icon}
                      onChange={e => setTopics(prev => prev.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}
                      style={inp}
                      placeholder="icon"
                    />
                    <input
                      value={t.color}
                      onChange={e => setTopics(prev => prev.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                      style={inp}
                      placeholder="#hex"
                    />
                    <button
                      type="button"
                      onClick={() => setTopics(prev => prev.filter((_, j) => j !== i))}
                      style={{ ...btnMini, color: T.red }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setTopics(prev => [
                      ...prev,
                      { id: `t${Date.now()}`, name: 'Шинэ сэдэв', icon: 'zap', color: '#6366F1' },
                    ])
                  }
                  style={{ ...btnMini, alignSelf: 'flex-start', color: T.green }}
                >
                  + Сэдэв
                </button>
              </div>

              <div style={{ fontWeight: 800, color: '#fff', marginBottom: 8, fontSize: 14 }}>10 түвшин (гарчиг, төрөл)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {lessons.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 56px 56px', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: T.muted, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                    <input
                      value={row.title}
                      onChange={e =>
                        setLessons(prev => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                      }
                      style={inp}
                    />
                    <select
                      value={row.type}
                      onChange={e =>
                        setLessons(prev => prev.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))
                      }
                      style={{ ...inp, cursor: 'pointer' }}
                    >
                      {TYPES.map(ty => (
                        <option key={ty} value={ty}>
                          {ty}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={row.xp}
                      onChange={e =>
                        setLessons(prev => prev.map((x, j) => (j === i ? { ...x, xp: +e.target.value } : x)))
                      }
                      style={inp}
                    />
                    <input
                      type="number"
                      value={row.coins}
                      onChange={e =>
                        setLessons(prev => prev.map((x, j) => (j === i ? { ...x, coins: +e.target.value } : x)))
                      }
                      style={inp}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={saving || lessons.length !== LEVELS_PER_TOPIC}
                onClick={() => void save()}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: saving ? T.muted : T.blue,
                  color: '#fff',
                  fontWeight: 800,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'Хадгалж…' : 'Серверт хадгалах (бүх сурагчид үзнэ)'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  fontSize: 12,
  background: '#1e293b',
  color: '#e2e8f0',
};

const btnMini: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: '#1e293b',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
};
