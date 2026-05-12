'use client';
import React, { useState } from 'react';
import { T } from '@/styles/tokens';

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  variant?: 'solid' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  full?: boolean;
  style?: React.CSSProperties;
  type?: 'button' | 'submit';
}

export function Btn({
  children, onClick, color = T.blue, variant = 'solid',
  size = 'md', disabled = false, full = false, style, type = 'button',
}: BtnProps) {
  const [hov, setHov] = useState(false);
  const pad = size === 'sm' ? '5px 12px' : size === 'lg' ? '11px 24px' : '8px 16px';
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 14 : 13;
  const bg  = variant === 'solid'
    ? disabled ? '#E2E8F0' : hov ? color + 'dd' : color
    : variant === 'ghost' ? hov ? color + '12' : 'transparent'
    : hov ? T.bg : T.surface;
  const textColor = variant === 'solid' ? (disabled ? T.muted : '#fff') : color;
  const border    = variant === 'outline' ? `1px solid ${color}` : 'none';

  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, fontSize: fs, fontWeight: 600,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        borderRadius: 8, border, background: bg, color: textColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.13s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        width: full ? '100%' : undefined,
        justifyContent: full ? 'center' : undefined,
        boxShadow: variant === 'solid' && !disabled ? '0 1px 2px rgba(0,0,0,0.10)' : 'none',
        ...style,
      }}>
      {children}
    </button>
  );
}
