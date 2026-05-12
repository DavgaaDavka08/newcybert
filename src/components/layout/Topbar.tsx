'use client';
import React from 'react';
import { T } from '@/styles/tokens';
import { Ic, Avatar } from '@/components/ui';
import type { AppState } from '@/types';

interface TopbarProps { title: string; sub?: string; appState: AppState; actions?: React.ReactNode; }

export function Topbar({ title, sub, appState, actions }: TopbarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: '-0.02em' }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
          <Ic n="flame" size={14} color={T.amber} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{appState.streak} өдөр</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
          <Ic n="coin" size={14} color={T.amber} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{appState.coins}</span>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic n="bell" size={15} color={T.muted} />
        </button>
        <Avatar name={appState.name} size={34} color={T.blue} />
        {actions}
      </div>
    </div>
  );
}

/** @deprecated alias */
export const TopBar = Topbar;
