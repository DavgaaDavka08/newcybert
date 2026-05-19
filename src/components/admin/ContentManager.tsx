'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { T } from '@/styles/tokens';

// ── Types ──────────────────────────────────────────────────────
interface Topic {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

interface QuestionEmbed {
  _id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Subtopic {
  _id: string;
  topicId: string;
  name: string;
  description: string;
  content: string;
  order: number;
  questions: QuestionEmbed[];
}

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#F97316'];
const ICONS  = ['⚡','🔥','💡','🧪','🌊','⚙️','🎯','📐','🔬','📊'];

function emptyQuestion(): QuestionEmbed {
  return { question: '', options: ['','','',''], correctIndex: 0, explanation: '' };
}

// ── TopicForm ──────────────────────────────────────────────────
function TopicForm({ initial, accentColor, submitLabel, onSubmit, onCancel }: {
  initial?: Partial<Topic>;
  accentColor: string;
  submitLabel: string;
  onSubmit: (name: string, color: string, icon: string, desc: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName]   = useState(initial?.name ?? '');
  const [desc, setDesc]   = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [icon, setIcon]   = useState(initial?.icon ?? ICONS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit(name.trim(), color, icon, desc.trim());
    setSaving(false);
  }

  return (
    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, background: '#F8FAFC' }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Сэдвийн нэр" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Тайлбар (заавал биш)" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {COLORS.map(c => (
          <div key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid #0f172a' : '2px solid transparent', transition: 'border 0.12s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {ICONS.map(ic => (
          <button key={ic} onClick={() => setIcon(ic)} style={{ fontSize: 18, width: 32, height: 32, borderRadius: 6, border: icon === ic ? `2px solid ${accentColor}` : `1px solid ${T.border}`, background: icon === ic ? '#EFF6FF' : '#fff', cursor: 'pointer' }}>{ic}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={handleSubmit} disabled={!name.trim() || saving} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: accentColor, color: '#fff', fontWeight: 700, fontSize: 12, cursor: name.trim() && !saving ? 'pointer' : 'not-allowed', opacity: name.trim() && !saving ? 1 : 0.6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {saving ? 'Хадгалж…' : submitLabel}
        </button>
        <button onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Болих</button>
      </div>
    </div>
  );
}

// ── TopicPanel ─────────────────────────────────────────────────
function TopicPanel({ topics, selected, onSelect, onAdd, onEdit, onDelete, loading }: {
  topics: Topic[]; selected: Topic | null;
  onSelect: (t: Topic) => void;
  onAdd: (name: string, color: string, icon: string, desc: string) => Promise<void>;
  onEdit: (id: string, name: string, color: string, icon: string, desc: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}) {
  const [showAdd, setShowAdd]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Сэдвүүд</span>
        <button onClick={() => { setShowAdd(v => !v); setEditingId(null); }} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: T.blue, lineHeight: 1 }}>+</button>
      </div>

      {showAdd && (
        <TopicForm
          accentColor={T.blue}
          submitLabel="Нэмэх"
          onSubmit={async (n, c, i, d) => { await onAdd(n, c, i, d); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 13 }}>Ачаалж байна…</div>}
        {!loading && topics.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>
            Сэдэв байхгүй байна.<br />+ товчоор нэмнэ үү.
          </div>
        )}
        {topics.map(t => (
          <div key={t._id}>
            <div onClick={() => { onSelect(t); setEditingId(null); }}
              style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: editingId === t._id ? 'none' : `1px solid ${T.border}`, background: selected?._id === t._id ? '#EFF6FF' : '#fff', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.12s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 11, color: T.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>}
              </div>
              <button onClick={e => { e.stopPropagation(); setEditingId(id => id === t._id ? null : t._id); setShowAdd(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14, padding: '4px', flexShrink: 0, lineHeight: 1 }} title="Засах">✎</button>
              <button onClick={e => { e.stopPropagation(); onDelete(t._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, padding: '4px', flexShrink: 0, opacity: 0.7, lineHeight: 1 }} title="Устгах">×</button>
            </div>
            {editingId === t._id && (
              <TopicForm
                initial={t}
                accentColor={t.color}
                submitLabel="Хадгалах"
                onSubmit={async (n, c, i, d) => { await onEdit(t._id, n, c, i, d); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SubtopicPanel ──────────────────────────────────────────────
function SubtopicPanel({ topic, subtopics, selected, onSelect, onAdd, onDelete, loading }: {
  topic: Topic | null;
  subtopics: Subtopic[];
  selected: Subtopic | null;
  onSelect: (s: Subtopic) => void;
  onAdd: (name: string, desc: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [saving, setSaving]     = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(name.trim(), desc.trim());
    setName(''); setDesc('');
    setShowForm(false);
    setSaving(false);
  }

  if (!topic) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 13, borderRight: `1px solid ${T.border}` }}>
        ← Сэдэв сонгоно уу
      </div>
    );
  }

  return (
    <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: T.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.name}</span>
          <span style={{ fontSize: 11, color: T.muted }}>Дэд сэдвүүд · {subtopics.length}</span>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: topic.color, lineHeight: 1, flexShrink: 0 }}>+</button>
      </div>

      {showForm && (
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, background: '#F8FAFC' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Дэд сэдвийн нэр" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Богино тайлбар" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 8, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAdd} disabled={!name.trim() || saving} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: topic.color, color: '#fff', fontWeight: 700, fontSize: 12, cursor: name.trim() && !saving ? 'pointer' : 'not-allowed', opacity: name.trim() && !saving ? 1 : 0.6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {saving ? 'Хадгалж…' : 'Нэмэх'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 13 }}>Ачаалж байна…</div>}
        {!loading && subtopics.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>
            Дэд сэдэв байхгүй байна.<br />+ товчоор нэмнэ үү.
          </div>
        )}
        {subtopics.map((s, idx) => (
          <div key={s._id} onClick={() => onSelect(s)}
            style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, background: selected?._id === s._id ? '#F0FDF4' : '#fff', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.12s' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${topic.color}22`, border: `1px solid ${topic.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: topic.color, flexShrink: 0 }}>{idx + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{s.questions.length}/10 асуулт</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onSelect(s); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14, padding: '4px', flexShrink: 0, lineHeight: 1 }}
              title="Засах">✎</button>
            <button onClick={e => { e.stopPropagation(); onDelete(s._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, padding: '4px', flexShrink: 0, opacity: 0.7, lineHeight: 1 }} title="Устгах">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QuestionEditor ─────────────────────────────────────────────
function QuestionEditor({ idx, q, onChange }: {
  idx: number;
  q: QuestionEmbed;
  onChange: (updated: QuestionEmbed) => void;
}) {
  const [open, setOpen] = useState(idx === 0);
  const filled = q.question.trim() && q.options.every(o => o.trim());

  return (
    <div style={{ border: `1px solid ${filled ? '#BBF7D0' : T.border}`, borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(v => !v)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: filled ? '#F0FDF4' : '#FAFAFA' }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: filled ? '#22C55E' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: filled ? '#fff' : '#64748B', flexShrink: 0 }}>{idx + 1}</div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: filled ? 600 : 400, color: filled ? T.text : T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.question.trim() || 'Асуулт оруулаагүй'}
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: '#fff' }}>
          <textarea
            value={q.question}
            onChange={e => onChange({ ...q, question: e.target.value })}
            placeholder={`${idx + 1}-р асуулт`}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 10 }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Хариултууд</div>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input
                type="radio"
                name={`correct-${idx}`}
                checked={q.correctIndex === oi}
                onChange={() => onChange({ ...q, correctIndex: oi })}
                style={{ flexShrink: 0, accentColor: '#22C55E' }}
              />
              <div style={{ width: 20, height: 20, borderRadius: 5, background: q.correctIndex === oi ? '#22C55E' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: q.correctIndex === oi ? '#fff' : '#64748B', flexShrink: 0 }}>
                {String.fromCharCode(65 + oi)}
              </div>
              <input
                value={opt}
                onChange={e => {
                  const newOpts = [...q.options];
                  newOpts[oi] = e.target.value;
                  onChange({ ...q, options: newOpts });
                }}
                placeholder={`${String.fromCharCode(65 + oi)} хариулт`}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: `1px solid ${q.correctIndex === oi ? '#86EFAC' : T.border}`, fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', background: q.correctIndex === oi ? '#F0FDF4' : '#fff' }}
              />
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Тайлбар (заавал биш)</div>
            <input
              value={q.explanation}
              onChange={e => onChange({ ...q, explanation: e.target.value })}
              placeholder="Зөв хариултын тайлбар"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── ContentEditorPanel ─────────────────────────────────────────
function ContentEditorPanel({ subtopic, topicColor, onSave }: {
  subtopic: Subtopic | null;
  topicColor: string;
  onSave: (updated: Partial<Subtopic>) => Promise<void>;
}) {
  const [name, setName]           = useState('');
  const [desc, setDesc]           = useState('');
  const [content, setContent]     = useState('');
  const [questions, setQuestions] = useState<QuestionEmbed[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    if (!subtopic) return;
    setName(subtopic.name);
    setDesc(subtopic.description ?? '');
    setContent(subtopic.content ?? '');
    const qs = Array.from({ length: 10 }, (_, i) => subtopic.questions[i] ?? emptyQuestion());
    setQuestions(qs);
    setSaved(false);
  }, [subtopic?._id]);

  async function handleSave() {
    if (!subtopic) return;
    setSaving(true);
    const filledQs = questions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    await onSave({ name, description: desc, content, questions: filledQs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!subtopic) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 13 }}>
        ← Дэд сэдэв сонгоно уу
      </div>
    );
  }

  const filledCount = questions.filter(q => q.question.trim() && q.options.every(o => o.trim())).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{subtopic.name}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{filledCount}/10 асуулт бөглөгдсөн</div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: saved ? '#22C55E' : topicColor, color: '#fff', fontWeight: 800, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'background 0.2s', minWidth: 100 }}>
          {saving ? 'Хадгалж…' : saved ? '✓ Хадгалсан' : 'Хадгалах'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Basic info */}
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: T.text, marginBottom: 12 }}>Үндсэн мэдээлэл</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5 }}>Нэр</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 14, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5 }}>Богино тайлбар</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Дэд сэдвийн богино тайлбар" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 5 }}>Агуулга / Тайлбар текст</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Энэ дэд сэдвийн талаарх тайлбар, томьёо, жишээ…" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
          </div>
        </div>

        {/* Questions */}
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: T.text }}>10 Асуулт</div>
            <div style={{ fontSize: 12, color: filledCount === 10 ? '#22C55E' : T.muted, fontWeight: 700 }}>
              {filledCount === 10 ? '✓ Бүгд бөглөгдсөн' : `${10 - filledCount} асуулт хоосон`}
            </div>
          </div>
          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              idx={i}
              q={q}
              onChange={updated => {
                const newQs = [...questions];
                newQs[i] = updated;
                setQuestions(newQs);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ContentManager (main) ──────────────────────────────────────
export function ContentManager() {
  const [topics, setTopics]           = useState<Topic[]>([]);
  const [subtopics, setSubtopics]     = useState<Subtopic[]>([]);
  const [selTopic, setSelTopic]       = useState<Topic | null>(null);
  const [selSubtopic, setSelSubtopic] = useState<Subtopic | null>(null);
  const [topicsLoading, setTopicsLoading]       = useState(true);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/topics')
      .then(r => r.json())
      .then(d => { setTopics(d.topics ?? []); setTopicsLoading(false); })
      .catch(() => setTopicsLoading(false));
  }, []);

  const loadSubtopics = useCallback(async (topicId: string) => {
    setSubtopicsLoading(true);
    try {
      const r = await fetch(`/api/admin/subtopics?topicId=${topicId}`);
      const d = await r.json();
      setSubtopics(d.subtopics ?? []);
    } finally {
      setSubtopicsLoading(false);
    }
  }, []);

  async function handleAddTopic(name: string, color: string, icon: string, desc: string) {
    const r = await fetch('/api/admin/topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color, icon, description: desc }) });
    const d = await r.json();
    if (d.topic) setTopics(prev => [...prev, d.topic]);
  }

  async function handleEditTopic(id: string, name: string, color: string, icon: string, desc: string) {
    const r = await fetch(`/api/admin/topics/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color, icon, description: desc }) });
    const d = await r.json();
    if (d.topic) {
      setTopics(prev => prev.map(t => t._id === id ? { ...t, ...d.topic } : t));
      if (selTopic?._id === id) setSelTopic(prev => prev ? { ...prev, ...d.topic } : prev);
    }
  }

  async function handleDeleteTopic(id: string) {
    if (!confirm('Сэдэв болон доорх бүх дэд сэдвийг устгах уу?')) return;
    await fetch(`/api/admin/topics/${id}`, { method: 'DELETE' });
    setTopics(prev => prev.filter(t => t._id !== id));
    if (selTopic?._id === id) { setSelTopic(null); setSubtopics([]); setSelSubtopic(null); }
  }

  async function handleSelectTopic(t: Topic) {
    setSelTopic(t);
    setSelSubtopic(null);
    await loadSubtopics(t._id);
  }

  async function handleAddSubtopic(name: string, desc: string) {
    if (!selTopic) return;
    const r = await fetch('/api/admin/subtopics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId: selTopic._id, name, description: desc, questions: [] }) });
    const d = await r.json();
    if (d.subtopic) {
      const newSt = { ...d.subtopic, questions: d.subtopic.questions ?? [] };
      setSubtopics(prev => [...prev, newSt]);
      setSelSubtopic(newSt);
    }
  }

  async function handleDeleteSubtopic(id: string) {
    if (!confirm('Дэд сэдэв болон асуултуудыг устгах уу?')) return;
    await fetch(`/api/admin/subtopics/${id}`, { method: 'DELETE' });
    setSubtopics(prev => prev.filter(s => s._id !== id));
    if (selSubtopic?._id === id) setSelSubtopic(null);
  }

  async function handleSaveSubtopic(updated: Partial<Subtopic>) {
    if (!selSubtopic) return;
    const r = await fetch(`/api/admin/subtopics/${selSubtopic._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    const d = await r.json();
    if (d.subtopic) {
      const merged = { ...selSubtopic, ...d.subtopic, questions: d.subtopic.questions ?? [] };
      setSubtopics(prev => prev.map(s => s._id === selSubtopic._id ? merged : s));
      setSelSubtopic(merged);
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', height: 'calc(100vh - 200px)', minHeight: 500, boxShadow: T.shadow }}>
      <TopicPanel
        topics={topics}
        selected={selTopic}
        onSelect={handleSelectTopic}
        onAdd={handleAddTopic}
        onEdit={handleEditTopic}
        onDelete={handleDeleteTopic}
        loading={topicsLoading}
      />
      <SubtopicPanel
        topic={selTopic}
        subtopics={subtopics}
        selected={selSubtopic}
        onSelect={setSelSubtopic}
        onAdd={handleAddSubtopic}
        onDelete={handleDeleteSubtopic}
        loading={subtopicsLoading}
      />
      <ContentEditorPanel
        subtopic={selSubtopic}
        topicColor={selTopic?.color ?? T.blue}
        onSave={handleSaveSubtopic}
      />
    </div>
  );
}
