'use client';
import React from 'react';
import { T } from '@/styles/tokens';
import { Ic, Avatar } from '@/components/ui';
import type { AppState } from '@/types';

interface TopbarProps { title: string; sub?: string; appState: AppState; actions?: React.ReactNode; }

export function Topbar({ title, sub, appState, actions }: TopbarProps) {
  return (
    <div className="dash-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
      <div className="dash-topbar-titles" style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: '-0.02em' }}>{title}</div>
        {sub && <div className="dash-topbar-sub" style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="dash-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* XP */}
        <div className="dash-topbar-chip" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #e0e7ff', background: '#eef2ff' }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5' }}>{appState.xp} XP</span>
        </div>
        {/* Streak */}
        <div className="dash-topbar-chip" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{appState.streak}</span>
        </div>
        {/* Coins */}
        <div className="dash-topbar-chip" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
          <span style={{ fontSize: 13 }}>🟡</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{appState.coins}</span>
          {appState.isPremium && <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>PRO</span>}
        </div>
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
