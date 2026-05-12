'use client';
import React from 'react';
import { T } from '@/styles/tokens';
import { Ic, Bar } from '@/components/ui';

interface Props {
  stats?: {
    totalStudents: number;
    activeToday: number;
    avgScore: number;
    totalXP: number;
    sessionsToday: number;
    completionRate: number;
  };
}

const DEFAULT_STATS = {
  totalStudents: 48,
  activeToday: 23,
  avgScore: 72,
  totalXP: 145200,
  sessionsToday: 7,
  completionRate: 68,
};

const WEAK_TOPICS = [
  { name: 'Механик',     pct: 42, color: T.red   },
  { name: 'Соронзон',    pct: 55, color: T.amber },
  { name: 'Дулаан',      pct: 63, color: T.amber },
  { name: 'Цахилгаан',   pct: 78, color: T.green },
  { name: 'Хэмжигдэхүүн', pct: 81, color: T.green },
];

export function AnalyticsCards({ stats = DEFAULT_STATS }: Props) {
  const CARDS = [
    { label: 'Нийт сурагч',     value: String(stats.totalStudents), icon: 'users',    color: T.blue,   delta: '+3 энэ долоо',   up: true  },
    { label: 'Өнөөдөр идэвхтэй', value: String(stats.activeToday),  icon: 'wifi',     color: T.green,  delta: '+5 өчигдөртэй', up: true  },
    { label: 'Дундаж оноо',      value: `${stats.avgScore}%`,       icon: 'award',    color: T.purple, delta: '+2%',            up: true  },
    { label: 'Нийт XP',          value: stats.totalXP.toLocaleString(), icon: 'zap',  color: T.amber,  delta: '+1,240 өнөөдөр', up: true  },
    { label: 'Тоглолт (өнөөдөр)',value: String(stats.sessionsToday), icon: 'game',    color: T.teal,   delta: '7 дуусгасан',    up: true  },
    { label: 'Дуусгалт хувь',    value: `${stats.completionRate}%`, icon: 'task',     color: T.green,  delta: '-2% долоо хоног', up: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {CARDS.map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n={c.icon} size={14} color={c.color} />
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: '-0.02em', marginBottom: 6 }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.up ? T.green : T.red, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Ic n="arrowUp" size={10} color={c.up ? T.green : T.red} style={{ transform: c.up ? undefined : 'rotate(180deg)' }} />
              {c.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Weak topics */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ic n="barChart" size={15} color={T.purple} /> Сэдвийн эзэмшилт
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WEAK_TOPICS.map((t, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{t.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.pct}%</span>
              </div>
              <Bar pct={t.pct} color={t.color} height={6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
