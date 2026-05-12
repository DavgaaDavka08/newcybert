'use client';
import React from 'react';
import { T } from '@/styles/tokens';

interface BadgeProps { children: React.ReactNode; color?: string; dot?: boolean; }
export function Badge({ children, color = T.blue, dot = false }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: color + '14', color, border: `1px solid ${color}22`, letterSpacing: '0.01em',
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

interface LabelProps { children: React.ReactNode; style?: React.CSSProperties; }
export function Label({ children, style }: LabelProps) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', ...style }}>
      {children}
    </div>
  );
}

export function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: T.border, ...style }} />;
}
