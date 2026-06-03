'use client';

import { Ic } from '@/components/ui';
import { T } from '@/styles/tokens';
import { CoinIcon } from './CoinIcon';
import { XpIcon, StreakIcon } from './GameIcon';

type StatWidgetsProps = {
  streak: number;
  lives: number;
  maxLives: number;
  accuracyPct: number | null;
  topicsCompleted: number;
  coins: number;
  xp: number;
};

export function StatWidgets({
  streak,
  lives,
  maxLives,
  accuracyPct,
  topicsCompleted,
  coins,
  xp,
}: StatWidgetsProps) {
  type Item =
    | { label: string; value: string; color: string; asset: 'streak' | 'xp' | 'coin' }
    | { label: string; value: string; color: string; icon: string };

  const items: Item[] = [
    { label: 'Streak', value: `${streak} өдөр`, color: '#EF4444', asset: 'streak' },
    { label: 'Life', value: `${lives}/${maxLives}`, color: '#EC4899', icon: 'zap' },
    {
      label: 'Accuracy',
      value: accuracyPct == null ? '—' : `${accuracyPct}%`,
      color: T.green,
      icon: 'award',
    },
    { label: 'Сэдэв', value: String(topicsCompleted), color: T.blue, icon: 'lesson' },
    { label: 'Coin', value: String(coins), color: T.amber, asset: 'coin' },
    { label: 'XP', value: xp.toLocaleString(), color: '#4F46E5', asset: 'xp' },
  ];

  return (
    <div className="cy-stat-widgets">
      {items.map((s) => (
        <div key={s.label} className="cy-stat-widget">
          <div className="cy-stat-widget-icon" style={{ background: s.color + '18' }}>
            {'asset' in s && s.asset === 'streak' && <StreakIcon size={22} />}
            {'asset' in s && s.asset === 'xp' && <XpIcon size={22} />}
            {'asset' in s && s.asset === 'coin' && <CoinIcon size={22} />}
            {'icon' in s && <Ic n={s.icon} size={16} color={s.color} />}
          </div>
          <div className="cy-stat-widget-val">{s.value}</div>
          <div className="cy-stat-widget-lbl">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
