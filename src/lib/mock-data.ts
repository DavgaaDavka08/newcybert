import type { Rank } from '@/types';

export const RANKS: Rank[] = [
  { name: 'Bronze', min: 0,    color: '#B45309' },
  { name: 'Silver', min: 500,  color: '#64748B' },
  { name: 'Gold',   min: 1200, color: '#D97706' },
  { name: 'Master', min: 2500, color: '#7C3AED' },
];

export function getRank(xp: number): Rank {
  let r = RANKS[0];
  for (const rk of RANKS) if (xp >= rk.min) r = rk;
  return r;
}

export const LEADERBOARD = [
  { name: 'Бат-Эрдэнэ', level: 14, xp: 2540, rank: 1, delta: '+41' },
  { name: 'Саруул',      level: 12, xp: 2310, rank: 2, delta: '+10' },
  { name: 'Энхжин',      level: 11, xp: 1980, rank: 3 },
  { name: 'Тамирлан',    level: 10, xp: 1750, rank: 4 },
  { name: 'Мөнхзул',     level:  9, xp: 1620, rank: 5 },
];
