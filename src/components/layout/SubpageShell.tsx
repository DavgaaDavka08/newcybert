'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { T } from '@/styles/tokens';
import { Ic } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { AppStateProvider } from '@/lib/app-state-context';

export function SubpageShell({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <SubpageShellInner>{children}</SubpageShellInner>
    </AppStateProvider>
  );
}

function SubpageShellInner({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileNavOpen]);

  return (
    <div className="dash-shell" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: T.bg }}>
      {/* Mobile overlay */}
      <button
        type="button"
        className={`dash-sidebar-overlay${mobileNavOpen ? ' dash-sidebar-overlay--visible' : ''}`}
        aria-label="Цэс хаах"
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, minHeight: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile-only sticky nav bar */}
        <div
          className="subpage-mobile-header"
          style={{
            background: '#fff',
            borderBottom: `1px solid ${T.border}`,
            padding: '0 12px',
            height: 54,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            style={{
              width: 40, height: 40, minWidth: 40,
              borderRadius: 10, border: `1.5px solid ${T.border}`,
              background: '#F8FAFC', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
            aria-label="Цэс нээх"
          >
            <Ic n="menu" size={20} color={T.text} />
          </button>

          {/* Home button */}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              width: 40, height: 40, minWidth: 40,
              borderRadius: 10, border: `1.5px solid ${T.border}`,
              background: '#EEF2FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
            aria-label="Нүүр хуудас"
            title="Нүүр хуудас"
          >
            <Ic n="home" size={18} color={T.blue} />
          </button>

          {/* Title */}
          <span style={{ flex: 1, fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>
            CyberPhysics
          </span>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
