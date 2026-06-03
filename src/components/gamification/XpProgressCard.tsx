'use client';

import { Bar, Ring } from '@/components/ui';
import { LevelIcon } from './GameIcon';
import { T } from '@/styles/tokens';
import { getRank } from '@/lib/ranks';

export type XpHistoryItem = { amount: number; reason: string; createdAt?: string };
export type LevelRewardInfo = { level: number; label: string };

type XpProgressCardProps = {
  xp: number;
  level: number;
  progress: {
    xpInLevel: number;
    xpToNext: number;
    remaining: number;
    pct: number;
    nextLevel: number;
  };
  xpHistory?: XpHistoryItem[];
  nextLevelReward?: LevelRewardInfo;
};

export function XpProgressCard({
  xp,
  level,
  progress,
  xpHistory = [],
  nextLevelReward,
}: XpProgressCardProps) {
  const rank = getRank(xp);

  return (
    <div className="cy-xp-card">
      <div className="cy-xp-card-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <LevelIcon size="lg" glow />
          <div>
          <div className="cy-xp-card-label">Түвшин {level}</div>
          <div className="cy-xp-card-title">
            Level {level} → {progress.nextLevel}
          </div>
          <div className="cy-xp-card-sub">
            {progress.xpToNext > 0
              ? `${progress.remaining} XP — Level ${progress.nextLevel}`
              : 'Дээд түвшин'}
          </div>
          </div>
        </div>
        <Ring pct={progress.pct} size={56} stroke={5} color={rank.color}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>{progress.pct}%</span>
        </Ring>
      </div>

      <div className="cy-xp-progress-numbers">
        <span>
          <strong>{progress.xpInLevel}</strong> / {progress.xpToNext} XP
        </span>
        <span className="cy-xp-remaining">Үлдсэн: {progress.remaining} XP</span>
      </div>
      <Bar pct={progress.pct} color={rank.color} height={8} />

      {nextLevelReward && (
        <div className="cy-xp-next-reward">
          Дараагийн шагнал (Lv {nextLevelReward.level}): {nextLevelReward.label}
        </div>
      )}

      {xpHistory.length > 0 && (
        <div className="cy-xp-history">
          <div className="cy-xp-history-title">Сүүлд авсан XP</div>
          {xpHistory.map((h, i) => (
            <div key={i} className="cy-xp-history-row">
              <span className="cy-xp-history-amt">+{h.amount} XP</span>
              <span className="cy-xp-history-reason">{h.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
