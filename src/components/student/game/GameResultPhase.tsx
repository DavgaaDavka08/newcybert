'use client';
import React, { useEffect, useState } from 'react';
import { calcStars } from '@/lib/game-data';

interface Props {
  score: number; total: number; mistakes: number;
  xpEarned: number; coinsEarned: number;
  topicName: string; topicColor: string; level: number;
  onBackMap: () => void; onRetry: () => void;
}

function StarDisplay({ stars, color }: { stars: number; color: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setShown(1), 300);
    const t2 = stars >= 2 ? setTimeout(() => setShown(2), 600) : null;
    const t3 = stars >= 3 ? setTimeout(() => setShown(3), 900) : null;
    return () => { clearTimeout(t1); t2 && clearTimeout(t2); t3 && clearTimeout(t3); };
  }, [stars]);
  const SIZE = [52, 68, 52];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
      {[0,1,2].map(i => {
        const filled = i < shown;
        const sz = SIZE[i];
        return (
          <div key={i} style={{ transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.25s', transform: filled ? 'scale(1)' : 'scale(0.4)', opacity: filled ? 1 : 0.2 }}>
            <svg width={sz} height={sz} viewBox="0 0 24 24">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={i < stars ? '#FBBF24' : '#E2E8F0'} stroke={i < stars ? '#F59E0B' : '#CBD5E1'} strokeWidth="1" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export function GameResultPhase({ score, total, mistakes, xpEarned, coinsEarned, topicName, topicColor, level, onBackMap, onRetry }: Props) {
  const stars = calcStars(mistakes);
  const pct   = Math.round((score / total) * 100);
  const messages = [
    { min: 0,  color: '#DC2626', title: 'Дахин оролдоорой!', sub: 'Алдаа нь суралцахын эх үүсвэр.' },
    { min: 50, color: '#D97706', title: 'Муугүй!',           sub: 'Бага зэрэг дутав, дахин давтаад үзэ.' },
    { min: 80, color: '#16A34A', title: 'Гайхалтай! 🎉',     sub: 'Маш сайн дүн! Ирэх level-д шилж.' },
  ];
  const msg = [...messages].reverse().find(m => pct >= m.min) ?? messages[0];

  return (
    <div style={{ maxWidth: 420, margin: '24px auto', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ borderRadius: 24, border: '1.5px solid #E2E8F0', background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${topicColor}22, ${topicColor}08)`, padding: '32px 28px 24px', textAlign: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: topicColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>{topicName} · Level {level}</div>
          <StarDisplay stars={stars} color={topicColor} />
          <div style={{ fontWeight: 900, fontSize: 24, color: msg.color, marginBottom: 4 }}>{msg.title}</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>{msg.sub}</div>
        </div>
        <div style={{ padding: '22px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Зөв',   val: score,       color: '#16A34A', bg: '#F0FDF4' },
              { label: 'Алдаа', val: mistakes,     color: '#DC2626', bg: '#FEF2F2' },
              { label: 'Нийт',  val: `${pct}%`,   color: topicColor, bg: topicColor + '12' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 22, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {(xpEarned > 0 || coinsEarned > 0) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#F5F3FF,#EFF6FF)', border: '1px solid #DDD6FE' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#7C3AED' }}>+{xpEarned}</div>
                <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>XP</div>
              </div>
              <div style={{ width: 1, background: '#DDD6FE' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#D97706' }}>+{coinsEarned}</div>
                <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>Коин</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBackMap} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid #E2E8F0', background: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#475569', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Буцах
            </button>
            <button onClick={onRetry} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${topicColor}, ${topicColor}cc)`, fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#fff', boxShadow: `0 4px 16px ${topicColor}44`, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Дахин
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
