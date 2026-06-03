'use client';

import { useState } from 'react';
import { T } from '@/styles/tokens';
import { Ic } from '@/components/ui';

export type LbEntry = {
  id: string;
  name: string;
  level: number;
  xp: number;
  periodXp?: number;
};

const PERIODS = [
  { id: 'today', label: 'Өнөөдөр' },
  { id: 'week', label: '7 хоног' },
  { id: 'all', label: 'Нийт' },
] as const;

type Period = (typeof PERIODS)[number]['id'];

export function LeaderboardPanel({
  entries,
  onPeriodChange,
}: {
  entries: LbEntry[];
  onPeriodChange: (p: Period) => void;
}) {
  const [period, setPeriod] = useState<Period>('all');

  function setP(p: Period) {
    setPeriod(p);
    onPeriodChange(p);
  }

  return (
    <div className="cy-lb-panel">
      <div className="cy-lb-head">
        <span className="cy-lb-title">
          <Ic n="trophy" size={14} color={T.amber} /> Шилдэг оюутнууд
        </span>
        <div className="cy-lb-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`cy-lb-tab${period === p.id ? ' cy-lb-tab--active' : ''}`}
              onClick={() => setP(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="cy-lb-empty">Жагсаалт хоосон</div>
      ) : (
        entries.map((p, i) => (
          <div key={p.id} className={`cy-lb-row${i === 0 ? ' cy-lb-row--first' : ''}`}>
            <span className="cy-lb-rank">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </span>
            <div className="cy-lb-name-wrap">
              <div className="cy-lb-name">{p.name}</div>
              <div className="cy-lb-meta">Lv {p.level}</div>
            </div>
            <span className="cy-lb-xp">{(p.periodXp ?? p.xp).toLocaleString()} XP</span>
          </div>
        ))
      )}
    </div>
  );
}
