import type { NavItem } from '@/types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Нүүр хуудас', icon: 'home',   path: '/dashboard' },
  { id: 'game',      label: 'Давталт',      icon: 'game',   path: '/dashboard/game' },
  { id: 'exam',      label: 'Шалгалт',      icon: 'task',   path: '/dashboard/exam' },
  { id: 'videos',    label: 'Видео хичээл', icon: 'video',  path: '/dashboard/videos' },
  { id: 'premium',   label: 'Premium',      icon: 'award',  path: '/dashboard/premium' },
];

export const ROUTES = {
  home:      '/',
  login:     '/login',
  dashboard: '/dashboard',
  game:      '/dashboard/game',
  admin:     '/admin',
} as const;
