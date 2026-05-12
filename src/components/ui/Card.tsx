'use client';
import React, { useState } from 'react';
import { T } from '@/styles/tokens';
import { Ic } from '@/components/ui/Icon';
import { Label } from '@/components/ui/Badge';

interface CardProps { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; pad?: number; }
export function Card({ children, style, onClick, pad = 20 }: CardProps) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => onClick && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface, border: `1px solid ${hov ? T.borderMd : T.border}`,
        borderRadius: 12, boxShadow: hov ? T.shadowMd : T.shadow,
        padding: pad, cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s', ...style,
      }}>
      {children}
    </div>
  );
}

interface StatCardProps { label: string; value: string; sub?: string; icon: string; color?: string; delta?: string; deltaUp?: boolean; }
export function StatCard({ label, value, sub, icon, color = T.blue, delta, deltaUp }: StatCardProps) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <Label>{label}</Label>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic n={icon} size={15} color={color} />
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 26, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      {(sub || delta) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {delta && (
            <span style={{ fontSize: 11, fontWeight: 600, color: deltaUp !== false ? T.green : T.red, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Ic n="arrowUp" size={11} color={deltaUp !== false ? T.green : T.red} />
              {delta}
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: T.muted }}>{sub}</span>}
        </div>
      )}
    </Card>
  );
}
