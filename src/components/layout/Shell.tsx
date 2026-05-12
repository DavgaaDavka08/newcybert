'use client';
import React from 'react';
import { T } from '@/styles/tokens';
import { Sidebar } from './Sidebar';

export { Sidebar } from './Sidebar';
export { Topbar, TopBar } from './Topbar';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: T.bg,
      backgroundImage: 'radial-gradient(circle, #CBD5E1 0.5px, transparent 0.5px)',
      backgroundSize: '20px 20px',
    }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh', padding: '24px 28px' }}>
        {children}
      </main>
    </div>
  );
}
