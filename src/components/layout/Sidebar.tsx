'use client';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { T } from '@/styles/tokens';
import { Ic, Avatar, Label } from '@/components/ui';
import { NAV_ITEMS } from '@/lib/routes';
import { getRank } from '@/lib/ranks';
import { useAppState } from '@/lib/app-state-context';
import { ProfileModal } from '@/components/layout/ProfileModal';

export function Sidebar() {
  const pathname        = usePathname();
  const router          = useRouter();
  const { appState }    = useAppState();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const rank            = getRank(appState.xp);
  const userName        = session?.user?.name ?? appState.name;

  return (
    <div className="dash-sidebar" style={{
      width: 230, flexShrink: 0, background: '#FFFFFF',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, zIndex: 10,
      borderRight: `1px solid ${T.border}`, boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/cyberphysic-logo.png" alt="CyberPhysics"
            style={{ height: 34, width: 'auto', objectFit: 'contain' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={{ fontWeight: 900, fontSize: 16, color: T.blue, letterSpacing: '-0.02em' }}>
            CyberPhysics
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        <Label style={{ padding: '4px 8px 6px', color: T.muted, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Үндсэн цэс
        </Label>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <button key={item.id} onClick={() => router.push(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 13, marginBottom: 3,
                border: active ? `1.5px solid ${T.blue}22` : '1.5px solid transparent',
                cursor: 'pointer', transition: 'all 0.14s ease',
                background: active ? `${T.blue}0f` : 'transparent',
                textAlign: 'left', fontFamily: 'Plus Jakarta Sans, sans-serif',
                position: 'relative', boxShadow: active ? `0 2px 12px ${T.blue}1a` : 'none',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = T.sidebarHover; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 3px 3px 0', background: T.blue }} />}
              <div style={{
                width: 33, height: 33, borderRadius: 10,
                background: active ? T.blue : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.14s', boxShadow: active ? `0 3px 10px ${T.blue}44` : 'none',
              }}>
                <Ic n={item.icon} size={16} color={active ? '#fff' : T.muted} />
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.blue : T.textSub }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: '10px 10px 14px', borderTop: `1px solid ${T.border}` }}>
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
    </div>
  );
}
