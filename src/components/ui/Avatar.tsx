'use client';
import React from 'react';
import { T } from '@/styles/tokens';

interface AvatarProps { name?: string; size?: number; color?: string; }
export function Avatar({ name = 'U', size = 32, color = T.blue }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: color + '18', border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color, flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {name[0]}
    </div>
  );
}
