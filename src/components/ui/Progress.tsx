'use client';
import React from 'react';
import { T } from '@/styles/tokens';

interface BarProps { pct?: number; color?: string; height?: number; }
export function Bar({ pct = 0, color = T.blue, height = 4 }: BarProps) {
  return (
    <div style={{ height, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 0.5s ease' }} />
    </div>
  );
}

interface RingProps { pct?: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode; }
export function Ring({ pct = 0, size = 80, stroke = 7, color = T.blue, children }: RingProps) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}
