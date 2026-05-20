'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from './Icon';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  /** light = white/dark UI (exam), dark = game dark UI */
  variant?: 'light' | 'dark';
  className?: string;
}

export function BackButton({
  href,
  onClick,
  label = 'Буцах',
  variant = 'light',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) onClick();
    else if (href) router.push(href);
    else router.back();
  };

  const isDark = variant === 'dark';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`cy-back-btn ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: isDark ? '10px 16px' : '8px 14px',
        borderRadius: 12,
        border: isDark ? '2px solid rgba(255,255,255,0.14)' : `1.5px solid ${isDark ? 'transparent' : '#e2e8f0'}`,
        background: isDark ? 'rgba(255,255,255,0.08)' : '#fff',
        color: isDark ? '#eaf2ff' : '#475569',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        flexShrink: 0,
        transition: 'background 0.15s, border-color 0.15s, transform 0.12s',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.14)' : '#f8fafc';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#fff';
      }}
    >
      <Ic n="chevLeft" size={16} color={isDark ? '#eaf2ff' : '#64748b'} />
      <span>{label}</span>
    </button>
  );
}
