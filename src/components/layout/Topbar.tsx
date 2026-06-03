'use client';
import React from 'react';
import { T } from '@/styles/tokens';
import { Ic, Avatar } from '@/components/ui';
import { CoinChip, LivesHearts, XpIcon, StreakIcon } from '@/components/gamification';
import { getXpProgress } from '@/lib/gamification';
import type { AppState } from '@/types';

interface TopbarProps {
  title: string;
  sub?: string;
  appState: AppState;
  actions?: React.ReactNode;
  lives?: number;
  maxLives?: number;
  nextRefillAt?: number | null;
  coinGoal?: { target: number; remaining: number; label: string };
}

export function Topbar({
  title,
  sub,
  appState,
  actions,
  lives,
  maxLives = 5,
  nextRefillAt = null,
  coinGoal,
}: TopbarProps) {
  const displayLives = lives ?? appState.lives;
  const level = getXpProgress(appState.xp).level;

  return (
    <div className="dash-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
      <div className="dash-topbar-titles" style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: '-0.02em' }}>{title}</div>
        {sub && <div className="dash-topbar-sub" style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="dash-topbar-actions dash-topbar-stats">
        <div className="dash-topbar-chip cy-chip-xp">
          <XpIcon size="md" glow />
          <span className="cy-chip-xp-val">
            Lv.{level} · {appState.xp} XP
          </span>
        </div>
        <div className="dash-topbar-chip cy-chip-streak">
          <StreakIcon size="md" glow />
          <span className="cy-chip-streak-val">{appState.streak}</span>
        </div>
        <LivesHearts lives={displayLives} maxLives={maxLives} nextRefillAt={nextRefillAt} compact />
        <CoinChip coins={appState.coins} isPremium={appState.isPremium} compact showGoal={false} coinGoal={coinGoal} />
        <button type="button" className="dash-topbar-icon-btn" style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic n="bell" size={15} color={T.muted} />
        </button>
        <Avatar name={appState.name} size={36} color={T.blue} />
        {actions}
      </div>
    </div>
  );
}

/** @deprecated alias */
export const TopBar = Topbar;
