'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { T } from '@/styles/tokens';
import { Ic, Avatar, Label } from '@/components/ui';
import { Loading } from '@/components/ui/Loading';
import { getRank } from '@/lib/ranks';
import { useAppState } from '@/lib/app-state-context';

const AIMags = [
  '',
  'Улаанбаатар',
  'Архангай',
  'Баян-Өлгий',
  'Баянхонгор',
  'Булган',
  'Говь-Алтай',
  'Говьсүмбэр',
  'Дорноговь',
  'Дорнод',
  'Дундговь',
  'Завхан',
  'Өвөрхангай',
  'Өмнөговь',
  'Сүхбаатар',
  'Сэлэнгэ',
  'Төв',
  'Увс',
  'Ховд',
  'Хөвсгөл',
  'Хэнтий',
];

export type ProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: string;
  school: string;
  grade?: number;
  hasPassword: boolean;
  googleId?: string;
  xp: number;
  level: number;
  coins: number;
  lives: number;
  streak: number;
  isPremium: boolean;
  role: string;
  examAttemptsCount: number;
  avgExamScorePct: number | null;
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: T.muted,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  fontSize: 14,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  color: T.text,
  background: T.surface,
};

interface Props {
  open: boolean;
  onClose: () => void;
  displayName: string;
}

export function ProfileModal({ open, onClose, displayName }: Props) {
  const { data: session, update } = useSession();
  const { setAppState } = useAppState();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [showPwHint, setShowPwHint] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [hasPassword, setHasPassword] = useState(true);
  const [googleId, setGoogleId] = useState<string | undefined>();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [examAttemptsCount, setExamAttemptsCount] = useState(0);
  const [avgExamScorePct, setAvgExamScorePct] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Ачаалахад алдаа гарлаа');
      }
      const p: ProfilePayload = await res.json();
      setFirstName(p.firstName ?? '');
      setLastName(p.lastName ?? '');
      setEmail(p.email ?? session?.user?.email ?? '');
      setPhone(p.phone ?? '');
      setProvince(p.province ?? '');
      setSchool(p.school ?? '');
      setGrade(p.grade != null ? String(p.grade) : '');
      setHasPassword(Boolean(p.hasPassword));
      setGoogleId(p.googleId);
      setXp(p.xp ?? 0);
      setLevel(p.level ?? 1);
      setCoins(p.coins ?? 0);
      setLives(p.lives ?? 0);
      setStreak(p.streak ?? 0);
      setIsPremium(Boolean(p.isPremium));
      setExamAttemptsCount(p.examAttemptsCount ?? 0);
      setAvgExamScorePct(p.avgExamScorePct ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (open) {
      void load();
      setPwErr(null);
      setCurrentPassword('');
      setNewPassword('');
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const rank = getRank(xp);

  async function saveProfile() {
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          province,
          school,
          grade: grade === '' ? null : Number(grade),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Хадгалахад алдаа гарлаа');
      const full = `${data.firstName ?? firstName} ${data.lastName ?? lastName}`.trim();
      setAppState(s => ({ ...s, name: full || s.name }));
      await update({ name: full });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setPwErr(null);
    setPwSaving(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Алдаа');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: unknown) {
      setPwErr(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setPwSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(540px, 100%)',
          maxHeight: 'min(92vh, 900px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 18,
          background: T.surface,
          boxShadow: T.shadowLg,
          border: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={displayName} size={44} color={T.blue} />
            <div>
              <div id="profile-modal-title" style={{ fontWeight: 800, fontSize: 17, color: T.text }}>
                Миний профайл
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                Lv {level} · {rank.name}
                {isPremium ? ' · Premium' : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: T.sidebarHover,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ic n="xCircle" size={16} color={T.muted} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '18px 20px 22px', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Loading size={72} message="Ачаалж байна…" />
            </div>
          )}
          {err && !loading && (
            <div style={{ padding: 12, borderRadius: 10, background: T.redLight, color: T.red, fontSize: 13, marginBottom: 14 }}>
              {err}
            </div>
          )}

          {!loading && (
            <>
              <Label style={{ ...fieldLabel, marginBottom: 10 }}>Тоглолт, түвшин</Label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  { k: 'XP', v: String(xp) },
                  { k: 'Rank', v: rank.name },
                  { k: 'Анги (тоглолт)', v: `Lv ${level}` },
                  { k: 'Зоос', v: String(coins) },
                  { k: 'Амь', v: String(lives) },
                  { k: 'Streak', v: `${streak} өдөр` },
                  { k: 'Шалгалт (давсан)', v: String(examAttemptsCount) },
                  { k: 'Дундаж оноо', v: avgExamScorePct != null ? `${avgExamScorePct}%` : '—' },
                ].map(row => (
                  <div
                    key={row.k}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${T.border}`,
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {row.k}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 4 }}>{row.v}</div>
                  </div>
                ))}
              </div>

              <Label style={{ ...fieldLabel, marginBottom: 10 }}>Хувийн мэдээлэл</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={fieldLabel}>Овог</div>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} placeholder="Дорж" />
                </div>
                <div>
                  <div style={fieldLabel}>Нэр</div>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} placeholder="Болд" />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={fieldLabel}>И-мэйл</div>
                <input value={email} readOnly style={{ ...inputStyle, background: '#F1F5F9', color: T.textSub }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={fieldLabel}>Нууц үг</div>
                  <button
                    type="button"
                    onClick={() => setShowPwHint(h => !h)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 8,
                    }}
                    title={showPwHint ? 'Нуух' : 'Харуулах'}
                  >
                    <Ic n="eye" size={18} color={T.muted} />
                  </button>
                </div>
                <div
                  style={{
                    ...inputStyle,
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F1F5F9',
                    color: T.textSub,
                  }}
                >
                  {googleId && !hasPassword ? (
                    <span>Google-ээр нэвтэрсэн (нууц үг байхгүй)</span>
                  ) : showPwHint ? (
                    <span style={{ letterSpacing: '0.04em' }}>6+ тэмдэгт (нууц)</span>
                  ) : (
                    <span style={{ letterSpacing: '0.15em' }}>••••••</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Нууц үгийг серверээс харуулдаггүй — доор шинээр солино уу.</div>
              </div>

              {hasPassword && (
                <div style={{ marginBottom: 16, padding: 14, borderRadius: 14, border: `1px dashed ${T.borderMd}`, background: T.blueLight }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Нууц үг солих</div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={fieldLabel}>Одоогийн нууц үг</div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      style={inputStyle}
                      autoComplete="current-password"
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={fieldLabel}>Шинэ нууц үг (6+ тэмдэгт)</div>
                      <button
                        type="button"
                        onClick={() => setShowNewPw(s => !s)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
                        aria-label={showNewPw ? 'Нууцлах' : 'Харуулах'}
                      >
                        <Ic n="eye" size={16} color={T.muted} />
                      </button>
                    </div>
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                  {pwErr && (
                    <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{pwErr}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => void savePassword()}
                    disabled={pwSaving || !currentPassword || newPassword.length < 6}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: T.blue,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: pwSaving || !currentPassword || newPassword.length < 6 ? 'not-allowed' : 'pointer',
                      opacity: pwSaving || !currentPassword || newPassword.length < 6 ? 0.55 : 1,
                    }}
                  >
                    {pwSaving ? 'Хадгалж…' : 'Нууц үг шинэчлэх'}
                  </button>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={fieldLabel}>Утасны дугаар</div>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="9900XXXX" inputMode="tel" />
              </div>

              <Label style={{ ...fieldLabel, marginTop: 8, marginBottom: 10 }}>Сургууль</Label>
              <div style={{ marginBottom: 12 }}>
                <div style={fieldLabel}>Аймаг / нийслэл</div>
                <select value={province} onChange={e => setProvince(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Сонгох —</option>
                  {AIMags.filter(Boolean).map(a => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={fieldLabel}>Сургууль</div>
                <input value={school} onChange={e => setSchool(e.target.value)} style={inputStyle} placeholder="Сургуулийн нэр" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={fieldLabel}>Анги</div>
                <select value={grade} onChange={e => setGrade(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Сонгох —</option>
                  {[6, 7, 8, 9, 10, 11, 12].map(g => (
                    <option key={g} value={String(g)}>
                      {g}-р анги
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: T.teal,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: saving ? 'wait' : 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {saving ? 'Хадгалж байна…' : 'Хувийн мэдээлэл хадгалах'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
