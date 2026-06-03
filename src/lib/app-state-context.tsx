'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { calcLevel, STARTER_COINS } from '@/lib/gamification';
import type { AppState } from '@/types';

const DEFAULT_STATE: AppState = {
  xp: 0, level: 1, coins: STARTER_COINS, lives: 5, streak: 0, name: 'Сурагч',
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
      const xp = Number(u.xp ?? 0);
      setAppStateRaw({
        xp,
        level:     calcLevel(xp),
        coins:     Number(u.coins ?? STARTER_COINS),
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

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/user/stats', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const xp = data.xp ?? 0;
      setAppStateRaw((prev) => ({
        ...prev,
        xp,
        level: data.level ?? data.progress?.level ?? calcLevel(xp),
        coins: data.coins ?? prev.coins,
        lives: data.lives ?? prev.lives,
        streak: data.streak ?? prev.streak,
        isPremium: data.isPremium ?? prev.isPremium,
        dailyFreeAIRemaining: data.dailyFreeAIRemaining ?? prev.dailyFreeAIRemaining,
        dailyFreeProblemRemaining: data.dailyFreeProblemRemaining ?? prev.dailyFreeProblemRemaining,
      }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && initialized) {
      void refreshStats();
    }
  }, [status, initialized, refreshStats]);

  function setAppState(fn: (s: AppState) => AppState) {
    setAppStateRaw((prev) => {
      const next = fn(prev);
      const level = calcLevel(next.xp);
      return level === next.level ? next : { ...next, level };
    });
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
