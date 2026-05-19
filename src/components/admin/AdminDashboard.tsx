'use client';
import React, { useState, useEffect } from 'react';
import { T } from '@/styles/tokens';
import { Ic, Badge } from '@/components/ui';
import { LiveGameControl } from './LiveGameControl';
import { ConnectedStudents } from './ConnectedStudents';
import { LiveLeaderboard } from './LiveLeaderboard';
import { AnalyticsCards, type DashboardAnalytics } from './AnalyticsCards';
import { QuestionBank } from './QuestionBank';

const EMPTY_DASH: DashboardAnalytics = {
  totalStudents: 0,
  activeToday: 0,
  avgScore: 0,
  totalXP: 0,
  sessionsToday: 0,
  completionRate: 0,
  weakTopics: [],
};

type AdminTab = 'overview' | 'live' | 'students' | 'analytics' | 'questions';

interface AdminDashboardProps {
  adminName?: string;
}

export function AdminDashboard({ adminName = 'Багш' }: AdminDashboardProps) {
  const [tab, setTab]           = useState<AdminTab>('overview');
  const [sessionActive, setSessionActive] = useState(false);
  const [dash, setDash]         = useState<DashboardAnalytics | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/admin/stats');
        const d = r.ok ? await r.json() : null;
        const board = d?.dashboard as DashboardAnalytics | undefined;
        if (!cancelled) setDash(board ?? EMPTY_DASH);
      } catch {
        if (!cancelled) setDash(EMPTY_DASH);
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const TABS: { id: AdminTab; label: string; icon: string; color: string }[] = [
    { id: 'overview',   label: 'Тойм',       icon: 'home',     color: T.blue   },
    { id: 'live',       label: 'Шууд тоглолт', icon: 'wifi',   color: T.green  },
    { id: 'students',   label: 'Сурагчид',   icon: 'users',    color: T.purple },
    { id: 'analytics',  label: 'Статистик',  icon: 'barChart', color: T.amber  },
    { id: 'questions',  label: 'Асуултын сан', icon: 'task',   color: T.purple },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, backgroundImage: 'radial-gradient(circle, #CBD5E1 0.5px, transparent 0.5px)', backgroundSize: '20px 20px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Top nav */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 50, boxShadow: T.shadow }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n="zap" size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, color: T.text }}>CyberPhysics</span>
              <Badge color={T.purple}>Admin</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {sessionActive && <Badge color={T.green} dot>Тоглолт явагдаж байна</Badge>}
            <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>{adminName}</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }}>
        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: T.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Удирдлагын самбар
          </div>
          <div style={{ fontSize: 13, color: T.muted }}>
            {new Date().toLocaleDateString('mn-MN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, padding: '5px', background: '#F1F5F9', borderRadius: 14, marginBottom: 28, width: 'fit-content' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: active ? 700 : 600, fontSize: 13, background: active ? '#fff' : 'transparent', color: active ? t.color : T.muted, boxShadow: active ? T.shadow : 'none', transition: 'all 0.15s' }}>
                <Ic n={t.icon} size={15} color={active ? t.color : T.muted} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quick actions */}
              <div style={{ background: 'linear-gradient(120deg, #0D9488 0%, #2563EB 60%, #7C3AED 100%)', borderRadius: 18, padding: '24px 28px', color: '#fff', boxShadow: '0 8px 32px rgba(13,148,136,0.25)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 24, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Сайн уу, {adminName}! 👋</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
                  {dashLoading
                    ? 'Статистик ачаалж байна…'
                    : `Өнөөдөр ${dash?.activeToday ?? 0} хэрэглэгч идэвхтэй. Шинэ тоглолт эхлүүлэх үү?`}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setTab('live')} style={{ padding: '10px 20px', borderRadius: 10, background: '#FFD23F', color: '#0F172A', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 16px rgba(255,210,63,0.4)' }}>
                    🎮 Тоглолт эхлэх
                  </button>
                  <button onClick={() => setTab('students')} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 13, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    👥 Сурагчид харах
                  </button>
                </div>
              </div>

              {dashLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.muted, background: '#fff', borderRadius: 14, border: `1px solid ${T.border}` }}>
                  Статистик ачаалж байна…
                </div>
              ) : (
                <AnalyticsCards stats={dash ?? EMPTY_DASH} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <LiveLeaderboard />
            </div>
          </div>
        )}

        {tab === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            <LiveGameControl onSessionChange={s => setSessionActive(s?.status === 'active')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <LiveLeaderboard live={sessionActive} />
              <ConnectedStudents sessionActive={sessionActive} />
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            <ConnectedStudents sessionActive={sessionActive} onKick={id => console.log('kick', id)} />
            <LiveLeaderboard />
          </div>
        )}

        {tab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
            {dashLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, background: '#fff', borderRadius: 14, border: `1px solid ${T.border}` }}>
                Статистик ачаалж байна…
              </div>
            ) : (
              <AnalyticsCards stats={dash ?? EMPTY_DASH} />
            )}
            <LiveLeaderboard />
          </div>
        )}

        {tab === 'questions' && <QuestionBank />}
      </div>
    </div>
  );
}
