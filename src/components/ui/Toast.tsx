'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  show: (opts: Omit<ToastItem, 'id'> | string, type?: ToastType) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; accent: string }> = {
  success: { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '#6ee7b7', icon: '✓', accent: '#059669' },
  error:   { bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '#fca5a5', icon: '✕', accent: '#dc2626' },
  warning: { bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#fcd34d', icon: '!', accent: '#d97706' },
  info:    { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '#93c5fd', icon: 'i', accent: '#2563eb' },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const s = STYLES[item.type];
  return (
    <div
      role="alert"
      className="cy-toast-item"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 16,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        boxShadow: '0 12px 40px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: s.accent,
          color: '#fff',
          fontWeight: 900,
          fontSize: item.type === 'info' ? 14 : 15,
        }}
      >
        {s.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.title && (
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4, lineHeight: 1.3 }}>
            {item.title}
          </div>
        )}
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, fontWeight: 500 }}>{item.message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Хаах"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 8,
          border: 'none',
          background: 'rgba(15,23,42,0.06)',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const show = useCallback((opts: Omit<ToastItem, 'id'> | string, type: ToastType = 'info') => {
    const item: ToastItem = typeof opts === 'string'
      ? { id: crypto.randomUUID(), type, message: opts }
      : { id: crypto.randomUUID(), duration: 4500, ...opts };

    setToasts(prev => [...prev.slice(-4), item]);

    const dur = item.duration ?? 4500;
    const timer = setTimeout(() => dismiss(item.id), dur);
    timers.current.set(item.id, timer);
  }, [dismiss]);

  const value: ToastContextValue = {
    show,
    success: (message, title) => show({ type: 'success', message, title }),
    error: (message, title) => show({ type: 'error', message, title }),
    warning: (message, title) => show({ type: 'warning', message, title }),
    info: (message, title) => show({ type: 'info', message, title }),
    dismiss,
  };

  useEffect(() => () => {
    timers.current.forEach(t => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="cy-toast-host" aria-live="polite" aria-relevant="additions">
        {toasts.map(item => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
