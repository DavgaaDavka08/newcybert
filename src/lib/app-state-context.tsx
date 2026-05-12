'use client';
import React, { createContext, useContext, useState } from 'react';
import type { AppState } from '@/types';

const DEFAULT_STATE: AppState = {
  xp: 150, level: 2, coins: 80, lives: 5, streak: 3, name: 'Зоригт',
};

interface AppStateContextValue {
  appState: AppState;
  setAppState: (fn: (s: AppState) => AppState) => void;
}

const AppStateContext = createContext<AppStateContextValue>({
  appState: DEFAULT_STATE,
  setAppState: () => {},
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [appState, setAppStateRaw] = useState<AppState>(DEFAULT_STATE);
  function setAppState(fn: (s: AppState) => AppState) {
    setAppStateRaw(prev => fn(prev));
  }
  return (
    <AppStateContext.Provider value={{ appState, setAppState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
