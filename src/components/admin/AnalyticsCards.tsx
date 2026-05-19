'use client';
import React from 'react';
import { T } from '@/styles/tokens';
import { Ic, Bar } from '@/components/ui';

export interface DashboardAnalytics {
  totalStudents: number;
  activeToday: number;
  avgScore: number;
  totalXP: number;
  sessionsToday: number;
  completionRate: number;
  weakTopics: { name: string; pct: number; color: string }[];
}

interface Props {
  stats: DashboardAnalytics;
}

export function AnalyticsCards({ stats }: Props) {
  const CARDS = [
    { label: 'Нийт сурагч', value: String(stats.totalStudents), icon: 'users', color: T.blue },
    { label: 'Өнөөдөр идэвхтэй', value: String(stats.activeToday), icon: 'wifi', color: T.green },
    { label: 'Дундаж оноо (шалгалт)', value: `${stats.avgScore}%`, icon: 'award', color: T.purple },
    { label: 'Нийт XP', value: stats.totalXP.toLocaleString(), icon: 'zap', color: T.amber },
    { label: 'Өнөөдөр дууссан шалгалт', value: String(stats.sessionsToday), icon: 'exam', color: T.teal },
    { label: 'Шалгалт өгсөн сурагч (хувь)', value: `${stats.completionRate}%`, icon: 'task', color: T.green },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {CARDS.map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n={c.icon} size={14} color={c.color} />
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: '-0.02em' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {stats.weakTopics && stats.weakTopics.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic n="barChart" size={15} color={T.purple} /> Сэдвийн эзэмшилт
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.weakTopics.map((t, i) => (
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
      )}
    </div>
  );
}
