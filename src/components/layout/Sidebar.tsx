'use client';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { T } from '@/styles/tokens';
import { Ic, Avatar } from '@/components/ui';
import { NAV_ITEMS } from '@/lib/routes';
import { getRank } from '@/lib/ranks';
import { useAppState } from '@/lib/app-state-context';
import { ProfileModal } from '@/components/layout/ProfileModal';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname        = usePathname();
  const router          = useRouter();
  const { appState }    = useAppState();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const rank            = getRank(appState.xp);
  const userName        = session?.user?.name ?? appState.name;

  function navigate(path: string) {
    router.push(path);
    onMobileClose?.();
  }

  return (
    <aside
      className={`dash-sidebar${mobileOpen ? ' dash-sidebar--open' : ''}`}
      style={{
      width: 236, flexShrink: 0,
      background: 'linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0,
      borderRight: `1px solid #E8EDFB`,
      boxShadow: '3px 0 20px rgba(37,99,235,0.06)',
    }}
    >
      <div className="dash-sidebar-mobile-head">
        <span style={{ fontWeight: 900, fontSize: 15, color: T.blue }}>Цэс</span>
        <button
          type="button"
          className="dash-sidebar-close"
          aria-label="Цэс хаах"
          onClick={onMobileClose}
        >
          <Ic n="close" size={20} color={T.text} />
        </button>
      </div>

      {/* Logo */}
      <div className="dash-sidebar-logo" style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/cyberphysic-logo.png" alt="CyberPhysics"
            style={{ height: 36, width: 'auto', objectFit: 'contain', borderRadius: 8 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: T.blue, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              CyberPhysics
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Физикийн суралцах платформ</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 8px' }}>
          Үндсэн цэс
        </div>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <button key={item.id} onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 12px', borderRadius: 12, marginBottom: 2,
                border: 'none',
                cursor: 'pointer', transition: 'all 0.15s ease',
                background: active ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : 'transparent',
                textAlign: 'left', fontFamily: 'Plus Jakarta Sans, sans-serif',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {active && <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 4px 4px 0', background: T.blue }} />}
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: active ? T.blue : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.15s',
                boxShadow: active ? `0 4px 12px ${T.blue}33` : 'none',
              }}>
                <Ic n={item.icon} size={16} color={active ? '#fff' : '#64748B'} />
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.blue : '#475569', letterSpacing: '-0.01em' }}>
                {item.label}
              </span>
              {active && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: T.blue, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: '10px 10px 14px', borderTop: `1px solid #E8EDFB` }}>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            background: '#F8FAFC',
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            marginBottom: 8,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            transition: 'box-shadow 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 2px ${T.blue}22`;
            (e.currentTarget as HTMLButtonElement).style.borderColor = T.blueMuted;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
          }}
        >
          <Avatar name={userName} size={32} color={T.blue} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>Lv {appState.level} · {rank.name}</div>
          </div>
          <Ic n="chevRight" size={14} color={T.muted} />
        </button>
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
          width: '100%', padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
          background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 600, color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif',
          transition: 'all 0.13s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.redLight; (e.currentTarget as HTMLButtonElement).style.color = T.red; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.muted; }}
        >
          <Ic n="logout" size={14} color="currentColor" />
          Гарах
        </button>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} displayName={userName} />
    </aside>
  );
}
