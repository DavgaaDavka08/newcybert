'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { AppState } from '@/types';

const DEFAULT_STATE: AppState = {
  xp: 0, level: 1, coins: 100, lives: 5, streak: 0, name: 'Сурагч',
  isPremium: false, dailyFreeAIRemaining: 3, dailyFreeProblemRemaining: 20,
};

interface AppStateContextValue {
  appState: AppState;
  setAppState: (fn: (s: AppState) => AppState) => void;
  refreshStats: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue>({
  appState: DEFAULT_STATE,
  setAppState: () => {},
  refreshStats: async () => {},
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [appState, setAppStateRaw] = useState<AppState>(DEFAULT_STATE);
  const [initialized, setInitialized] = useState(false);

  // Sync from session on login
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !initialized) {
      const u = session.user;
      setAppStateRaw({
        xp:        Number(u.xp ?? 0),
        level:     Number(u.level ?? 1),
        coins:     Number(u.coins ?? 100),
        lives:     Number(u.lives ?? 5),
        streak:    Number(u.streak ?? 0),
        name:      u.name ?? "Сурагч",
        isPremium: Boolean((u as any).isPremium ?? false),
        dailyFreeAIRemaining:      Number((u as any).dailyFreeAIRemaining ?? 3),
        dailyFreeProblemRemaining: Number((u as any).dailyFreeProblemRemaining ?? 20),
      });
      setInitialized(true);
    }
  }, [status, session, initialized]);

  function setAppState(fn: (s: AppState) => AppState) {
    setAppStateRaw(prev => fn(prev));
  }

  // Pull latest stats from server and update local state + session
  async function refreshStats() {
    try {
      const res = await fetch('/api/user/stats');
      if (!res.ok) return;
      const data = await res.json();
      setAppStateRaw(prev => ({
        ...prev,
        xp:        data.xp        ?? prev.xp,
        level:     data.level     ?? prev.level,
        coins:     data.coins     ?? prev.coins,
        lives:     data.lives     ?? prev.lives,
        streak:    data.streak    ?? prev.streak,
        isPremium: data.isPremium ?? prev.isPremium,
        dailyFreeAIRemaining:      data.dailyFreeAIRemaining      ?? prev.dailyFreeAIRemaining,
        dailyFreeProblemRemaining: data.dailyFreeProblemRemaining ?? prev.dailyFreeProblemRemaining,
      }));
    } catch {}
  }

  return (
    <AppStateContext.Provider value={{ appState, setAppState, refreshStats }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
