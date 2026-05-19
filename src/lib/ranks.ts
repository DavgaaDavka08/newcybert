import type { Rank } from '@/types';

export const RANKS: Rank[] = [
  { name: 'Bronze', min: 0, color: '#B45309' },
  { name: 'Silver', min: 500, color: '#64748B' },
  { name: 'Gold', min: 1200, color: '#D97706' },
  { name: 'Master', min: 2500, color: '#7C3AED' },
];

export function getRank(xp: number): Rank {
  let r = RANKS[0];
  for (const rk of RANKS) if (xp >= rk.min) r = rk;
  return r;
}
