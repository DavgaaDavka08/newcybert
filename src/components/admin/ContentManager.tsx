'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { T } from '@/styles/tokens';
import { AdminIcon, TOPIC_ICON_GLYPHS, type AdminIconName } from '@/components/admin/AdminIcon';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

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

type MobileStep = 'topics' | 'lessons' | 'editor';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const ICONS = [...TOPIC_ICON_GLYPHS];

const WIZARD_STEPS = [
  { id: 'topics' as const, num: 1, title: 'Сэдэв', hint: 'Тоглоомын бүлэг' },
  { id: 'lessons' as const, num: 2, title: 'Хичээл', hint: 'Дэд сэдэв / түвшин' },
  { id: 'editor' as const, num: 3, title: 'Агуулга', hint: 'Текст + 10 асуулт' },
];

function emptyQuestion(): QuestionEmbed {
  return { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };
}

function questionFilled(q: QuestionEmbed) {
  return Boolean(q.question.trim() && q.options.every((o) => o.trim()));
}

function listRowKeyActivate(e: React.KeyboardEvent, onActivate: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onActivate();
  }
}

/** Clickable row — div (not button) so action buttons can nest inside */
function CourseListRow({
  selected,
  onActivate,
  children,
}: {
  selected: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`course-list-item${selected ? ' selected' : ''}`}
      onClick={onActivate}
      onKeyDown={(e) => listRowKeyActivate(e, onActivate)}
    >
      {children}
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: AdminIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="course-empty">
      <div className="course-empty-icon"><AdminIcon name={icon} size={36} /></div>
      <h4>{title}</h4>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="course-panel-add" onClick={onAction}>
          + {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── TopicForm ──────────────────────────────────────────────────
function TopicForm({
  initial,
  accentColor,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Topic>;
  accentColor: string;
  submitLabel: string;
  onSubmit: (name: string, color: string, icon: string, desc: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? ICONS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit(name.trim(), color, icon, desc.trim());
    setSaving(false);
  }

  return (
    <div className="course-inline-form">
      <div className="field field-compact">
        <label className="label">Сэдвийн нэр *</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Жишээ: Механик, Цахилгаан"
        />
      </div>
      <div className="field field-compact">
        <label className="label">Тайлбар</label>
        <input
          className="input"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Сурагчид харагдах богино тайлбар"
        />
      </div>
      <label className="label">Өнгө</label>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label="Өнгө сонгох"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: c,
              border: color === c ? '2px solid #0f172a' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
      <label className="label">Дүрс</label>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {ICONS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => setIcon(ic)}
            style={{
              fontSize: 18,
              width: 34,
              height: 34,
              borderRadius: 8,
              border: icon === ic ? `2px solid ${accentColor}` : '1px solid #e2e8f0',
              background: icon === ic ? '#eff6ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            {ic}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="btn primary"
          style={{ flex: 1 }}
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
        >
          {saving ? 'Хадгалж…' : submitLabel}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Болих
        </button>
      </div>
    </div>
  );
}

// ── TopicPanel ─────────────────────────────────────────────────
function TopicPanel({
  topics,
  selected,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  loading,
  isActive = true,
}: {
  topics: Topic[];
  selected: Topic | null;
  onSelect: (t: Topic) => void;
  onAdd: (name: string, color: string, icon: string, desc: string) => Promise<void>;
  onEdit: (id: string, name: string, color: string, icon: string, desc: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
  isActive?: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className={`course-panel course-panel--topics${isActive ? ' is-active' : ''}`}>
      <div className="course-panel-head">
        <div className="course-panel-head-top">
          <div>
            <div className="course-panel-step">Алхам 1</div>
            <div className="course-panel-title">Сэдэв (бүлэг)</div>
            <div className="course-panel-hint">
              Тоглоомын газрын зураг дээрх том бүлэг — жишээ нь «Механик»
            </div>
          </div>
          <button
            type="button"
            className="course-panel-add"
            onClick={() => {
              setShowAdd(true);
              setEditingId(null);
            }}
          >
            + Шинэ
          </button>
        </div>
      </div>

      {showAdd && (
        <TopicForm
          accentColor={T.blue}
          submitLabel="Сэдэв нэмэх"
          onSubmit={async (n, c, i, d) => {
            await onAdd(n, c, i, d);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="course-panel-scroll">
        {loading && (
          <div className="course-empty">
            <Loading size={80} message="Ачаалж байна…" />
          </div>
        )}
        {!loading && topics.length === 0 && !showAdd && (
          <EmptyState
            icon="map"
            title="Эхлээд нэг сэдэв үүсгэнэ үү"
            description="Сэдэв нь тоглоомын газрын зураг дээрх том бүлэг юм. Дараа нь түүний доор хичээлүүд нэмнэ."
            actionLabel="Шинэ сэдэв"
            onAction={() => setShowAdd(true)}
          />
        )}
        {topics.map((t) => (
          <div key={t._id}>
            <CourseListRow
              selected={selected?._id === t._id}
              onActivate={() => {
                onSelect(t);
                setEditingId(null);
              }}
            >
              <div className="course-item-icon" style={{ background: `${t.color}22`, border: `1px solid ${t.color}44`, fontSize: 16, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                {t.icon}
              </div>
              <div className="course-item-body">
                <div className="course-item-name">{t.name}</div>
                {t.description && <div className="course-item-meta">{t.description}</div>}
              </div>
              <div className="course-list-actions">
                <button
                  type="button"
                  className="course-icon-btn"
                  title="Засах"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId((id) => (id === t._id ? null : t._id));
                    setShowAdd(false);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="course-icon-btn danger"
                  title="Устгах"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t._id);
                  }}
                >
                  ×
                </button>
              </div>
            </CourseListRow>
            {editingId === t._id && (
              <TopicForm
                initial={t}
                accentColor={t.color}
                submitLabel="Хадгалах"
                onSubmit={async (n, c, i, d) => {
                  await onEdit(t._id, n, c, i, d);
                  setEditingId(null);
                }}
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
function SubtopicPanel({
  topic,
  subtopics,
  selected,
  onSelect,
  onAdd,
  onDelete,
  loading,
  isActive = true,
}: {
  topic: Topic | null;
  subtopics: Subtopic[];
  selected: Subtopic | null;
  onSelect: (s: Subtopic) => void;
  onAdd: (name: string, desc: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
  isActive?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(name.trim(), desc.trim());
    setName('');
    setDesc('');
    setShowForm(false);
    setSaving(false);
  }

  if (!topic) {
    return (
      <div className={`course-panel course-panel--lessons${isActive ? ' is-active' : ''}`}>
        <div className="course-editor-placeholder">
          <div className="course-empty-icon" style={{ marginBottom: 12 }}><AdminIcon name="chevron-left" size={40} /></div>
          <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Эхлээд зүүн талаас сэдэв сонгоно уу</h4>
          <p style={{ margin: 0, fontSize: 13, maxWidth: 280, lineHeight: 1.5 }}>
            Сэдэв сонгосны дараа энэ хэсэгт тухайн бүлгийн хичээлүүд (дэд сэдвүүд) харагдана.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`course-panel course-panel--lessons${isActive ? ' is-active' : ''}`}>
      <div className="course-panel-head">
        <div className="course-panel-head-top">
          <div>
            <div className="course-panel-step">Алхам 2</div>
            <div className="course-panel-title">Хичээл (дэд сэдэв)</div>
            <div className="course-panel-hint">
              Тоглоомын од бүр — нэг түвшин. Сурагч эндээс «Эхлэх» дарна.
            </div>
          </div>
          <button type="button" className="course-panel-add" style={{ background: topic.color }} onClick={() => setShowForm(true)}>
            + Хичээл
          </button>
        </div>
        <div className="course-progress-bar" title={`${subtopics.length} хичээл`}>
          <div className="course-progress-fill" style={{ width: `${Math.min(100, subtopics.length * 10)}%` }} />
        </div>
      </div>

      {showForm && (
        <div className="course-inline-form">
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="label">Хичээлийн нэр *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Жишээ: Ньютоны хууль"
            />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label">Богино тайлбар</label>
            <input
              className="input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Сурагчид харагдах товч тайлбар"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn primary"
              style={{ flex: 1, background: topic.color, borderColor: topic.color }}
              onClick={handleAdd}
              disabled={!name.trim() || saving}
            >
              {saving ? 'Хадгалж…' : 'Хичээл нэмэх'}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>
              Болих
            </button>
          </div>
        </div>
      )}

      <div className="course-panel-scroll">
        {loading && (
          <div className="course-empty">
            <Loading size={80} message="Ачаалж байна…" />
          </div>
        )}
        {!loading && subtopics.length === 0 && !showForm && (
          <EmptyState
            icon="node"
            title={`«${topic.name}»-д хичээл нэмнэ үү`}
            description="Нэг хичээл = тоглоомын нэг од. Дараа нь 10 асуулт бөглөнө."
            actionLabel="Шинэ хичээл"
            onAction={() => setShowForm(true)}
          />
        )}
        {subtopics.map((s, idx) => {
          const filled = s.questions.filter(questionFilled).length;
          const ready = filled >= 1;
          return (
            <CourseListRow
              key={s._id}
              selected={selected?._id === s._id}
              onActivate={() => onSelect(s)}
            >
              <div
                className="course-item-icon"
                style={{
                  background: `${topic.color}18`,
                  border: `1px solid ${topic.color}55`,
                  fontSize: 13,
                  fontWeight: 800,
                  color: topic.color,
                }}
              >
                {idx + 1}
              </div>
              <div className="course-item-body">
                <div className="course-item-name">{s.name}</div>
                <div className="course-item-meta">
                  {ready ? (
                    <span style={{ color: filled === 10 ? '#16a34a' : '#ca8a04' }}>
                      {filled}/10 асуулт {filled === 10 ? '✓' : ''}
                    </span>
                  ) : (
                    <span style={{ color: '#dc2626' }}>Асуулт оруулаагүй</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="course-icon-btn danger"
                title="Устгах"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s._id);
                }}
              >
                ×
              </button>
            </CourseListRow>
          );
        })}
      </div>
    </div>
  );
}

// ── QuestionEditor ─────────────────────────────────────────────
function QuestionEditor({
  idx,
  q,
  onChange,
}: {
  idx: number;
  q: QuestionEmbed;
  onChange: (updated: QuestionEmbed) => void;
}) {
  const [open, setOpen] = useState(idx === 0);
  const filled = questionFilled(q);

  return (
    <div className={`course-question-card${filled ? ' filled' : ''}`}>
      <button type="button" className="course-question-head" style={{ width: '100%', border: 'none', textAlign: 'left' }} onClick={() => setOpen((v) => !v)}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: filled ? '#22c55e' : '#e2e8f0',
            color: filled ? '#fff' : '#64748b',
            fontSize: 11,
            fontWeight: 800,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {idx + 1}
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: filled ? 600 : 400, color: filled ? '#0f172a' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {q.question.trim() || `${idx + 1}-р асуулт — дарж бөглөнө үү`}
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
          <label className="label">Асуулт *</label>
          <textarea
            className="textarea"
            rows={2}
            value={q.question}
            onChange={(e) => onChange({ ...q, question: e.target.value })}
            placeholder="Асуултын текст"
            style={{ marginBottom: 12 }}
          />
          <label className="label">Зөв хариулт (радио сонгоно)</label>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <input
                type="radio"
                name={`correct-${idx}`}
                checked={q.correctIndex === oi}
                onChange={() => onChange({ ...q, correctIndex: oi })}
                style={{ accentColor: '#22c55e' }}
              />
              <span style={{ width: 22, fontSize: 11, fontWeight: 800, color: '#64748b' }}>{String.fromCharCode(65 + oi)}</span>
              <input
                className="input"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...q.options];
                  newOpts[oi] = e.target.value;
                  onChange({ ...q, options: newOpts });
                }}
                placeholder={`${String.fromCharCode(65 + oi)} хариулт`}
                style={{
                  flex: 1,
                  borderColor: q.correctIndex === oi ? '#86efac' : undefined,
                  background: q.correctIndex === oi ? '#f0fdf4' : undefined,
                }}
              />
            </div>
          ))}
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Тайлбар (заавал биш)</label>
            <input
              className="input"
              value={q.explanation}
              onChange={(e) => onChange({ ...q, explanation: e.target.value })}
              placeholder="Зөв хариултын тайлбар"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── ContentEditorPanel ─────────────────────────────────────────
function ContentEditorPanel({
  subtopic,
  topic,
  onSave,
  isActive = true,
}: {
  subtopic: Subtopic | null;
  topic: Topic | null;
  onSave: (updated: Partial<Subtopic>) => Promise<void>;
  isActive?: boolean;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [content, setContent] = useState('');
  const [questions, setQuestions] = useState<QuestionEmbed[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const topicColor = topic?.color ?? T.blue;

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
    const filledQs = questions.filter(questionFilled);
    await onSave({ name, description: desc, content, questions: filledQs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!subtopic || !topic) {
    return (
      <div className={`course-panel course-panel--editor${isActive ? ' is-active' : ''}`}>
        <div className="course-editor-placeholder">
          <div className="course-empty-icon" style={{ marginBottom: 12 }}><AdminIcon name="book" size={40} /></div>
          <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Хичээл сонгоод агуулга бөглөнө үү</h4>
          <p style={{ margin: 0, fontSize: 13, maxWidth: 320, lineHeight: 1.55 }}>
            <strong>1.</strong> Сэдэв үүсгэх → <strong>2.</strong> Хичээл нэмэх → <strong>3.</strong> Тайлбар текст + 10 асуулт оруулах → <strong>Хадгалах</strong>
          </p>
        </div>
      </div>
    );
  }

  const filledCount = questions.filter(questionFilled).length;
  const progressPct = (filledCount / 10) * 100;

  return (
    <div className={`course-panel course-panel--editor${isActive ? ' is-active' : ''}`}>
      <div className="course-save-bar">
        <div>
          <div className="course-panel-step">Алхам 3</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{subtopic.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {filledCount}/10 асуулт · {topic.icon} {topic.name}
          </div>
          <div className="course-progress-bar" style={{ maxWidth: 200, marginTop: 8 }}>
            <div className="course-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={handleSave}
          disabled={saving}
          style={{
            minWidth: 120,
            background: saved ? '#22c55e' : topicColor,
            borderColor: saved ? '#22c55e' : topicColor,
          }}
        >
          {saving ? 'Хадгалж…' : saved ? '✓ Хадгалсан' : 'Хадгалах'}
        </button>
      </div>

      <div className="course-panel-scroll" style={{ padding: '16px 20px' }}>
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Үндсэн мэдээлэл</h3>
          <div className="field">
            <label className="label">Хичээлийн нэр</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Богино тайлбар</label>
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Жагсаалтад харагдана" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Сурах агуулга (текст)</label>
            <textarea
              className="textarea"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Томьёо, тайлбар, жишээ — сурагч эхлэхээс өмнө уншина"
            />
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>10 асуулт (тоглоом)</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: filledCount === 10 ? '#16a34a' : '#64748b' }}>
              {filledCount === 10 ? '✓ Бэлэн' : `${10 - filledCount} хоосон`}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
            Хамгийн багадаа <strong>1 асуулт</strong> бөглөх ёстой. Сурагч «Эхлэх» дархад эдгээр асуулт гарна.
          </p>
          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              idx={i}
              q={q}
              onChange={(updated) => {
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

// ── Course wizard bar ──────────────────────────────────────────
function CourseWizardBar({
  activeStep,
  hasTopic,
  hasLesson,
  onStepClick,
}: {
  activeStep: MobileStep;
  hasTopic: boolean;
  hasLesson: boolean;
  onStepClick: (step: MobileStep) => void;
}) {
  const done = {
    topics: hasTopic,
    lessons: hasLesson,
    editor: hasLesson,
  };

  return (
    <div className="course-wizard">
      <div className="course-wizard-steps">
        {WIZARD_STEPS.map((step, i) => {
          const isActive = activeStep === step.id;
          const isDone =
            step.id === 'topics' ? done.topics : step.id === 'lessons' ? done.lessons : done.editor && hasLesson;
          const canClick = step.id === 'topics' || (step.id === 'lessons' && hasTopic) || (step.id === 'editor' && hasLesson);

          return (
            <React.Fragment key={step.id}>
              {i > 0 && <div className={`course-wizard-connector${isDone ? ' done' : ''}`} />}
              <button
                type="button"
                className={`course-wizard-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                disabled={!canClick}
                onClick={() => canClick && onStepClick(step.id)}
              >
                <span className="course-step-num">{isDone && !isActive ? '✓' : step.num}</span>
                <span className="course-step-text">
                  <strong>{step.title}</strong>
                  <span>{step.hint}</span>
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── ContentManager (main) ──────────────────────────────────────
export function ContentManager() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [selTopic, setSelTopic] = useState<Topic | null>(null);
  const [selSubtopic, setSelSubtopic] = useState<Subtopic | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('topics');
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    fetch('/api/admin/topics')
      .then((r) => r.json())
      .then((d) => {
        setTopics(d.topics ?? []);
        setTopicsLoading(false);
      })
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
    const r = await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, icon, description: desc }),
    });
    if (!r.ok) {
      toast.error('Сэдэв нэмэхэд алдаа гарлаа');
      return;
    }
    const d = await r.json();
    if (d.topic) {
      setTopics((prev) => [...prev, d.topic]);
      setSelTopic(d.topic);
      await loadSubtopics(d.topic._id);
      if (isNarrow) setMobileStep('lessons');
    }
  }

  async function handleEditTopic(id: string, name: string, color: string, icon: string, desc: string) {
    const r = await fetch(`/api/admin/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, icon, description: desc }),
    });
    const d = await r.json();
    if (d.topic) {
      setTopics((prev) => prev.map((t) => (t._id === id ? { ...t, ...d.topic } : t)));
      if (selTopic?._id === id) setSelTopic((prev) => (prev ? { ...prev, ...d.topic } : prev));
    }
  }

  async function handleDeleteTopic(id: string) {
    const ok = await confirm({
      title: 'Сэдэв устгах',
      description: 'Сэдэв болон доорх бүх хичээлийг устгах уу?',
      confirmLabel: 'Устгах',
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/admin/topics/${id}`, { method: 'DELETE' });
    setTopics((prev) => prev.filter((t) => t._id !== id));
    if (selTopic?._id === id) {
      setSelTopic(null);
      setSubtopics([]);
      setSelSubtopic(null);
      setMobileStep('topics');
    }
  }

  async function handleSelectTopic(t: Topic) {
    setSelTopic(t);
    setSelSubtopic(null);
    await loadSubtopics(t._id);
    if (isNarrow) setMobileStep('lessons');
  }

  async function handleAddSubtopic(name: string, desc: string) {
    if (!selTopic) return;
    const r = await fetch('/api/admin/subtopics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: selTopic._id, name, description: desc, questions: [] }),
    });
    const d = await r.json();
    if (d.subtopic) {
      const newSt = { ...d.subtopic, questions: d.subtopic.questions ?? [] };
      setSubtopics((prev) => [...prev, newSt]);
      setSelSubtopic(newSt);
      if (isNarrow) setMobileStep('editor');
    }
  }

  function handleSelectSubtopic(s: Subtopic) {
    setSelSubtopic(s);
    if (isNarrow) setMobileStep('editor');
  }

  async function handleDeleteSubtopic(id: string) {
    const ok = await confirm({
      title: 'Хичээл устгах',
      description: 'Хичээл болон асуултуудыг устгах уу?',
      confirmLabel: 'Устгах',
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/admin/subtopics/${id}`, { method: 'DELETE' });
    setSubtopics((prev) => prev.filter((s) => s._id !== id));
    if (selSubtopic?._id === id) {
      setSelSubtopic(null);
      if (isNarrow) setMobileStep('lessons');
    }
  }

  async function handleSaveSubtopic(updated: Partial<Subtopic>) {
    if (!selSubtopic) return;
    const r = await fetch(`/api/admin/subtopics/${selSubtopic._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!r.ok) {
      toast.error('Хадгалах үед алдаа гарлаа');
      return;
    }
    const d = await r.json();
    if (d.subtopic) {
      const merged = { ...selSubtopic, ...d.subtopic, questions: d.subtopic.questions ?? [] };
      setSubtopics((prev) => prev.map((s) => (s._id === selSubtopic._id ? merged : s)));
      setSelSubtopic(merged);
    }
  }

  const activeStep: MobileStep = !selTopic ? 'topics' : !selSubtopic ? 'lessons' : 'editor';
  const displayStep = isNarrow ? mobileStep : activeStep;

  return (
    <div className="course-builder">
      <CourseWizardBar
        activeStep={displayStep}
        hasTopic={Boolean(selTopic)}
        hasLesson={Boolean(selSubtopic)}
        onStepClick={setMobileStep}
      />

      {selTopic && (
        <div className="course-breadcrumb" style={{ padding: '0 20px 12px', background: '#fafbff', borderBottom: '1px solid #e2e8f0' }}>
          <button type="button" onClick={() => { setSelTopic(null); setSelSubtopic(null); setMobileStep('topics'); }}>
            Бүх сэдэв
          </button>
          <span className="sep">›</span>
          <button
            type="button"
            onClick={() => { setSelSubtopic(null); setMobileStep('lessons'); }}
            style={{ fontWeight: selSubtopic ? 500 : 700, color: selSubtopic ? undefined : '#0f172a' }}
          >
            {selTopic.icon} {selTopic.name}
          </button>
          {selSubtopic && (
            <>
              <span className="sep">›</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{selSubtopic.name}</span>
            </>
          )}
        </div>
      )}

      {isNarrow && displayStep !== 'topics' && (
        <button
          type="button"
          className="course-mobile-back"
          onClick={() => setMobileStep(displayStep === 'editor' ? 'lessons' : 'topics')}
        >
          ← Буцах
        </button>
      )}

      <div className={`course-body${isNarrow ? ' is-mobile-step' : ''}`}>
        <TopicPanel
          topics={topics}
          selected={selTopic}
          onSelect={handleSelectTopic}
          onAdd={handleAddTopic}
          onEdit={handleEditTopic}
          onDelete={handleDeleteTopic}
          loading={topicsLoading}
          isActive={!isNarrow || displayStep === 'topics'}
        />
        <SubtopicPanel
          topic={selTopic}
          subtopics={subtopics}
          selected={selSubtopic}
          onSelect={handleSelectSubtopic}
          onAdd={handleAddSubtopic}
          onDelete={handleDeleteSubtopic}
          loading={subtopicsLoading}
          isActive={!isNarrow || displayStep === 'lessons'}
        />
        <ContentEditorPanel
          subtopic={selSubtopic}
          topic={selTopic}
          onSave={handleSaveSubtopic}
          isActive={!isNarrow || displayStep === 'editor'}
        />
      </div>
    </div>
  );
}
