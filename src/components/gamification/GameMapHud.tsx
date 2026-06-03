'use client';

import { useEffect, useState } from 'react';
import { Ic } from '@/components/ui';
import { CoinIcon } from './CoinIcon';
import { XpIcon, StreakIcon } from './GameIcon';
import { LivesHearts } from './LivesHearts';
import { useAppState } from '@/lib/app-state-context';
import { getXpProgress, MAX_LIVES } from '@/lib/gamification';
import type { AppState } from '@/types';

type GameMapHudProps = {
  state: AppState;
  lives: number;
  maxLives?: number;
  nextRefillAt?: number | null;
  onBackToDashboard?: () => void;
};

export function GameMapHud({
  state,
  lives,
  maxLives = MAX_LIVES,
  nextRefillAt = null,
  onBackToDashboard,
}: GameMapHudProps) {
  const { refreshStats } = useAppState();
  const [refill, setRefill] = useState<number | null>(nextRefillAt);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (nextRefillAt != null) {
      setRefill(nextRefillAt);
      return;
    }
    if (state.isPremium) return;
    fetch('/api/user/stats', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.nextRefillAt === 'number') setRefill(d.nextRefillAt);
      })
      .catch(() => {});
  }, [nextRefillAt, state.isPremium]);

  const progress = getXpProgress(state.xp);
  const displayLives = state.isPremium ? maxLives : lives;

  return (
    <header className="game-map-hud">
      {onBackToDashboard ? (
        <button type="button" className="game-map-hud-back" onClick={onBackToDashboard}>
          <Ic n="chevLeft" size={16} color="#eaf2ff" />
          <span>Нүүр</span>
        </button>
      ) : null}

      <div className="game-map-hud-strip" role="group" aria-label="Тоглоомын статистик">
        <div
          className="gm-chip gm-chip--xp"
          title={`Түвшин ${progress.level} · ${state.xp} XP · дараагийн түвшин ${progress.remaining} XP`}
        >
          <div className="gm-chip-row">
            <XpIcon size={22} glow />
            <div className="gm-chip-text">
              <span className="gm-chip-primary">
                Lv.{progress.level} · {state.xp.toLocaleString()} XP
              </span>
              <span className="gm-chip-secondary">
                {progress.xpInLevel}/{progress.xpToNext} · Lv.{progress.nextLevel}
              </span>
            </div>
          </div>
          <div className="gm-progress" aria-hidden>
            <div className="gm-progress-fill gm-progress-fill--xp" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        <div className="gm-chip gm-chip--streak" title={`${state.streak} өдрийн streak`}>
          <StreakIcon size={22} glow />
          <div className="gm-chip-text gm-chip-text--center">
            <span className="gm-chip-primary">{state.streak}</span>
            <span className="gm-chip-secondary">streak</span>
          </div>
        </div>

        <div className="gm-chip gm-chip--lives" title="Амь">
          <LivesHearts
            lives={displayLives}
            maxLives={maxLives}
            nextRefillAt={state.isPremium ? null : refill}
            compact
            variant="dark"
            heartStyle="dots"
          />
        </div>

        <div className="gm-chip gm-chip--coin" title={`${state.coins} зоос`}>
          <CoinIcon size={22} glow />
          <div className="gm-chip-text gm-chip-text--center">
            <span className="gm-chip-primary">{state.coins.toLocaleString()}</span>
            <span className="gm-chip-secondary gm-chip-secondary--coin">зоос</span>
          </div>
        </div>
      </div>
    </header>
  );
}
