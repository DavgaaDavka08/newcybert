'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { T } from '@/styles/tokens';
import { Ic, Badge, Card } from '@/components/ui';

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  totalLevels: number;
  isActive: boolean;
  order: number;
}

interface Question {
  _id: string;
  question: string;
  formula?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  coinReward: number;
  level: number;
  categoryId: { _id: string; name: string; icon: string; color: string } | string;
}

interface Toast {
  msg: string;
  type: 'success' | 'error';
}

interface PlaceholderItem {
  question: string;
  formula: string;
  topic: string;
}

const DEFAULT_FORM = {
  categoryId: '',
  question: '',
  formula: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  xpReward: 10,
  coinReward: 5,
  level: 1,
};

const DIFF_CONFIG = {
  easy: { label: 'Хялбар', color: T.green },
  medium: { label: 'Дунд', color: T.amber },
  hard: { label: 'Хэцүү', color: T.red },
};

const PLACEHOLDER_SAMPLES: PlaceholderItem[] = [
  { topic: 'Механик', question: 'Хоёр биеийн хоорондох таталцлын хүч ямар томьёогоор тооцоологддог вэ?', formula: 'F = G·m₁m₂/r²' },
  { topic: 'Механик', question: 'm масстай биеийн кинетик энерги?', formula: 'Eк = mv²/2' },
  { topic: 'Цахилгаан', question: 'Ом-ын хуулийн дагуу гүйдлийг ол', formula: 'I = U/R' },
  { topic: 'Цахилгаан', question: 'Конденсаторын хуримтлуулах энерги?', formula: 'W = CU²/2' },
  { topic: 'Дулаан', question: 'Идеал хийн төлвийн тэгшитгэл', formula: 'PV = nRT' },
  { topic: 'Оптик', question: 'Гэрлийн хугарлын хууль', formula: 'n₁sinθ₁ = n₂sinθ₂' },
];

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: T.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  borderRadius: 10,
  border: `1.5px solid ${T.border}`,
  fontSize: 13,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  outline: 'none',
  color: T.text,
  background: '#FAFBFC',
  boxSizing: 'border-box',
};

export function QuestionBank() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const r = await fetch('/api/admin/categories');
    if (r.ok) {
      const d = await r.json();
      setCategories(d.categories ?? []);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const url =
      selectedCat === 'all'
        ? '/api/admin/questions?limit=100'
        : `/api/admin/questions?categoryId=${selectedCat}&limit=100`;
    try {
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        setQuestions(d.questions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCat]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (selectedCat !== 'all') {
      setForm(f => ({ ...f, categoryId: selectedCat }));
    }
  }, [selectedCat]);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setForm({
      ...DEFAULT_FORM,
      categoryId: selectedCat !== 'all' ? selectedCat : '',
    });
    setEditingId(null);
  }

  function startEdit(q: Question) {
    const catId = typeof q.categoryId === 'object' ? q.categoryId._id : q.categoryId;
    setEditingId(q._id);
    setForm({
      categoryId: catId,
      question: q.question,
      formula: q.formula ?? '',
      options: [...q.options],
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? '',
      difficulty: q.difficulty,
      xpReward: q.xpReward,
      coinReward: q.coinReward,
      level: q.level ?? 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    if (!form.categoryId || !form.question.trim() || form.options.some(o => !o.trim())) {
      showToast('Бүх талбарыг бөглөнө үү', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        question: form.question.trim(),
        formula: form.formula.trim() || undefined,
        options: form.options.map(o => o.trim()),
        explanation: form.explanation.trim(),
      };

      const r = editingId
        ? await fetch('/api/admin/questions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingId, ...payload }),
          })
        : await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (r.ok) {
        showToast(editingId ? '✓ Асуулт шинэчлэгдлээ' : '✓ Асуулт амжилттай нэмэгдлээ', 'success');
        resetForm();
        loadQuestions();
      } else {
        const d = await r.json().catch(() => ({}));
        showToast(d.error ?? 'Алдаа гарлаа, дахин оролдоно уу', 'error');
      }
    } catch {
      showToast('Алдаа гарлаа, дахин оролдоно уу', 'error');
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Асуултыг устгах уу?')) return;
    const r = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
    if (r.ok) {
      showToast('Асуулт устгагдлаа', 'success');
      if (editingId === id) resetForm();
      loadQuestions();
    } else {
      showToast('Устгахад алдаа гарлаа', 'error');
    }
  }

  function getCatColor(q: Question): string {
    if (typeof q.categoryId === 'object') return q.categoryId.color ?? T.blue;
    const cat = categories.find(c => c._id === q.categoryId);
    return cat?.color ?? T.blue;
  }

  const selectedCatObj =
    selectedCat === 'all' ? undefined : categories.find(c => c._id === selectedCat);

  const formCat =
    categories.find(c => c._id === form.categoryId) ?? selectedCatObj;

  const placeholders = PLACEHOLDER_SAMPLES.filter(p => {
    if (selectedCat === 'all') return true;
    const name = selectedCatObj?.name ?? '';
    return p.topic === name || name.includes(p.topic) || p.topic.includes(name);
  });

  function scrollToForm() {
    document.getElementById('qb-add-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: 20,
        alignItems: 'start',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* LEFT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            style={{
              padding: '7px 16px',
              borderRadius: 99,
              border: `2px solid ${selectedCat === 'all' ? T.blue : T.border}`,
              background: selectedCat === 'all' ? T.blueLight : '#fff',
              color: selectedCat === 'all' ? T.blue : T.muted,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Бүгд
          </button>
          {categories.map(cat => {
            const active = selectedCat === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => setSelectedCat(cat._id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 99,
                  border: `2px solid ${active ? cat.color : T.border}`,
                  background: active ? cat.color + '15' : '#fff',
                  color: active ? cat.color : T.textSub,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: T.muted,
              background: '#fff',
              borderRadius: 14,
              border: `1px solid ${T.border}`,
            }}
          >
            Ачаалж байна...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                background: '#fff',
                borderRadius: 14,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 6 }}>
                Энэ сэдэвт асуулт байхгүй байна
              </div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
                Баруун талын формоор асуулт нэмнэ үү
              </div>
              <button
                type="button"
                onClick={scrollToForm}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: T.blue,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                + Асуулт нэмэх
              </button>
            </div>

            {placeholders.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Жишээ асуултууд (загвар)
                </div>
                {placeholders.map((p, idx) => {
                  const cat = categories.find(
                    c => c.name === p.topic || c.name.includes(p.topic)
                  );
                  const color = cat?.color ?? T.muted;
                  return (
                    <div
                      key={`ph-${idx}`}
                      style={{
                        background: '#fff',
                        borderRadius: 14,
                        padding: '16px 18px',
                        border: `1px dashed ${T.borderMd}`,
                        opacity: 0.55,
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: color + '18',
                            color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          ~
                        </div>
                        <div>
                          <Badge color={T.muted}>{p.topic}</Badge>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.textSub, marginTop: 8, lineHeight: 1.5 }}>
                            {p.question}
                          </div>
                          <div
                            style={{
                              display: 'inline-block',
                              marginTop: 8,
                              fontFamily: 'monospace',
                              fontSize: 13,
                              background: color + '12',
                              color,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontWeight: 700,
                            }}
                          >
                            {p.formula}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.map((q, idx) => {
              const diff = DIFF_CONFIG[q.difficulty] ?? DIFF_CONFIG.medium;
              const color = getCatColor(q);
              const hovered = hoveredId === q._id;
              return (
                <div
                  key={q._id}
                  onMouseEnter={() => setHoveredId(q._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: '16px 18px',
                    border: `1px solid ${editingId === q._id ? T.blue : T.border}`,
                    boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.10)' : T.shadow,
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: color + '18',
                        color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: T.text,
                          marginBottom: 8,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {q.question}
                      </div>
                      {q.formula && (
                        <div
                          style={{
                            display: 'inline-block',
                            fontFamily: 'monospace',
                            fontSize: 13,
                            background: color + '12',
                            color,
                            padding: '4px 10px',
                            borderRadius: 6,
                            marginBottom: 10,
                            fontWeight: 700,
                          }}
                        >
                          {q.formula}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Badge color={diff.color}>{diff.label}</Badge>
                        <Badge color={T.amber}>+{q.xpReward} XP</Badge>
                        <span style={{ fontSize: 11, color: T.muted }}>Lvl {q.level}</span>
                        <div
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            gap: 6,
                            opacity: hovered ? 1 : 0,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startEdit(q)}
                            title="Засах"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: `1px solid ${T.border}`,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ic n="file" size={15} color={T.textSub} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q._id)}
                            title="Устгах"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              border: `1px solid ${T.red}33`,
                              background: T.redLight,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ic n="xCircle" size={15} color={T.red} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — form */}
      <div id="qb-add-form" style={{ position: 'sticky', top: 80 }}>
        <Card style={{ padding: '20px 22px', background: '#fff', borderRadius: 14 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 4 }}>
              {editingId ? '✏️ Асуулт засах' : '➕ Асуулт нэмэх'}
            </div>
            {formCat && (
              <div style={{ fontSize: 12, color: formCat.color, fontWeight: 700 }}>
                {formCat.icon} {formCat.name}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Сэдэв</div>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              style={inputStyle}
            >
              <option value="">— Сэдэв сонгох —</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Асуулт</div>
            <textarea
              rows={3}
              placeholder="Жишээ: Ом-ын хуулийн дагуу I-г ол..."
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>
              Томьёо{' '}
              <span style={{ textTransform: 'none', fontWeight: 500 }}>(заавал биш)</span>
            </div>
            <input
              placeholder="Жишээ: I = U / R"
              value={form.formula}
              onChange={e => setForm(f => ({ ...f, formula: e.target.value }))}
              style={inputStyle}
            />
            {form.formula && (
              <div
                style={{
                  marginTop: 8,
                  display: 'inline-block',
                  fontFamily: 'monospace',
                  fontSize: 15,
                  background: (formCat?.color ?? T.blue) + '12',
                  color: formCat?.color ?? T.blue,
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                {form.formula}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Хариултууд — зөв хариултыг сонгоно уу</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {form.options.map((opt, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={form.correctIndex === i}
                    onChange={() => setForm(f => ({ ...f, correctIndex: i }))}
                    style={{ accentColor: T.green, width: 15, height: 15, flexShrink: 0 }}
                  />
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: form.correctIndex === i ? T.green + '18' : T.border,
                      color: form.correctIndex === i ? T.green : T.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {'ABCD'[i]}
                  </div>
                  <input
                    placeholder={`Хариулт ${'ABCD'[i]}`}
                    value={opt}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        options: f.options.map((v, k) => (k === i ? e.target.value : v)),
                      }))
                    }
                    style={{
                      ...inputStyle,
                      border: `2px solid ${form.correctIndex === i ? T.green : T.border}`,
                      fontSize: 12,
                      padding: '6px 10px',
                    }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Хүнд байдал</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.entries(DIFF_CONFIG) as [keyof typeof DIFF_CONFIG, { label: string; color: string }][]).map(
                ([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, difficulty: key }))}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 10,
                      border: `2px solid ${form.difficulty === key ? val.color : T.border}`,
                      background: form.difficulty === key ? val.color + '15' : '#fff',
                      color: form.difficulty === key ? val.color : T.muted,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {val.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={labelStyle}>XP шагнал</div>
              <input
                type="number"
                value={form.xpReward}
                min={0}
                onChange={e => setForm(f => ({ ...f, xpReward: +e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>Coin шагнал</div>
              <input
                type="number"
                value={form.coinReward}
                min={0}
                onChange={e => setForm(f => ({ ...f, coinReward: +e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={labelStyle}>
              Тайлбар <span style={{ textTransform: 'none', fontWeight: 500 }}>(заавал биш)</span>
            </div>
            <textarea
              rows={2}
              placeholder="Зөв хариултын тайлбар..."
              value={form.explanation}
              onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
              style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 12,
                  border: `1px solid ${T.border}`,
                  background: '#fff',
                  color: T.textSub,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Цуцлах
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              style={{
                flex: 2,
                padding: '12px 0',
                borderRadius: 12,
                background: submitting ? T.muted : T.blue,
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {submitting ? 'Хадгалж байна...' : editingId ? 'Шинэчлэх' : 'Хадгалах'}
            </button>
          </div>
        </Card>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            padding: '12px 20px',
            borderRadius: 12,
            background: toast.type === 'success' ? T.green : T.red,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontFamily: 'inherit',
          }}
        >
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
