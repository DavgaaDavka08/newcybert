'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { T } from '@/styles/tokens';
import { Ic } from '@/components/ui';
import { Sidebar } from './Sidebar';

export { Sidebar } from './Sidebar';
export { Topbar, TopBar } from './Topbar';

const BG_URL = '/475450911_537240926008065_5395618463015848016_n.jpg';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="dash-shell" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: T.bg }}>
      <button
        type="button"
        className={`dash-sidebar-overlay${mobileNavOpen ? ' dash-sidebar-overlay--visible' : ''}`}
        aria-label="Цэс хаах"
        onClick={() => setMobileNavOpen(false)}
      />

      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main
        className="dash-main"
        style={{
          position: 'relative',
          flex: 1,
          overflowY: 'auto',
          minHeight: '100vh',
          minWidth: 0,
          width: '100%',
          padding: '24px 28px',
          backgroundColor: T.bg,
        }}
      >
        <header className="dash-mobile-header">
          <button
            type="button"
            className="dash-menu-btn"
            aria-label="Цэс нээх"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <Ic n="menu" size={20} color={T.text} />
          </button>
          <span className="dash-mobile-header-title">CyberPhysics</span>
        </header>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              backgroundImage: `url(${BG_URL})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              filter: 'saturate(0.95) brightness(1.05)',
              transform: 'scale(1.06)',
              opacity: 0.82,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: [
                'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(248,250,252,0.22) 42%, rgba(240,244,248,0.48) 100%)',
                'radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.12), transparent 50%)',
              ].join(', '),
            }}
          />
        </div>
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%' }}>{children}</div>
      </main>
    </div>
  );
}
