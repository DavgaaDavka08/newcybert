'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shell } from './Shell';
import { DashboardScreen, GameScreen } from '@/components/student';
import { AppStateProvider, useAppState } from '@/lib/app-state-context';
import { ROUTES } from '@/lib/routes';
import type { Screen } from '@/types';

function screenFromPath(pathname: string): Screen {
  return pathname.startsWith(ROUTES.game) ? 'game' : 'dashboard';
}

export function MainApp() {
  return (
    <AppStateProvider>
      <MainAppContent />
    </AppStateProvider>
  );
}

function MainAppContent() {
  const pathname            = usePathname();
  const router              = useRouter();
  const { appState, setAppState } = useAppState();
  const screen              = screenFromPath(pathname);

  function nav(s: Screen) {
    router.push(s === 'game' ? ROUTES.game : ROUTES.dashboard);
  }

  // Game screen is full-viewport — no Shell/Sidebar
  if (screen === 'game') {
    return <GameScreen onNav={nav} state={appState} setState={setAppState} />;
  }

  return (
    <Shell>
      <DashboardScreen onNav={nav} state={appState} />
    </Shell>
  );
}
