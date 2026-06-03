'use client';

import { COIN_VIDEO_UNLOCK } from '@/lib/gamification';
import { CoinIcon } from './CoinIcon';

type CoinChipProps = {
  coins: number;
  isPremium?: boolean;
  compact?: boolean;
  showGoal?: boolean;
  coinGoal?: { target: number; remaining: number; label: string };
};

export function CoinChip({
  coins,
  isPremium = false,
  compact = false,
  showGoal = true,
  coinGoal,
}: CoinChipProps) {
  const target = coinGoal?.target ?? COIN_VIDEO_UNLOCK;
  const remaining = coinGoal?.remaining ?? Math.max(0, target - coins);
  const pct = Math.min(100, Math.round((coins / target) * 100));

  return (
    <div className={`cy-coin-chip${compact ? ' cy-coin-chip--compact' : ''}`}>
      <div className="cy-coin-chip-main">
        <CoinIcon size={compact ? 'sm' : 'lg'} glow animate={!compact} />
        <div className="cy-coin-text">
          <div className="cy-coin-amount-row">
            <span className="cy-coin-amount">{coins}</span>
            <span className="cy-coin-unit">Зоос</span>
          </div>
          {!compact && (
            <span className={`cy-account-badge${isPremium ? ' cy-account-badge--premium' : ''}`}>
              {isPremium ? '👑 PREMIUM' : '◉ BASIC'}
            </span>
          )}
        </div>
      </div>
      {showGoal && !compact && (
        <div className="cy-coin-goal">
          <div className="cy-coin-goal-label">
            {coinGoal?.label ?? 'Дараагийн видео нээх'} — {coins}/{target}
          </div>
          <div className="cy-coin-goal-bar">
            <div className="cy-coin-goal-fill" style={{ width: `${pct}%` }} />
          </div>
          {remaining > 0 && (
            <div className="cy-coin-goal-hint">{remaining} зоос дутуу</div>
          )}
        </div>
      )}
    </div>
  );
}
