import type { NavItem } from '@/types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Нүүр хуудас', icon: 'home', path: '/dashboard' },
  { id: 'game',      label: 'Давталт',     icon: 'game', path: '/dashboard/game' },
];

export const ROUTES = {
  home:      '/',
  login:     '/login',
  dashboard: '/dashboard',
  game:      '/dashboard/game',
  admin:     '/admin',
} as const;
