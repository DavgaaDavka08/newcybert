'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export type GameIconKind = 'xp' | 'streak' | 'level';

const SOURCES: Record<GameIconKind, string> = {
  xp: '/level.png',
  level: '/level.png',
  streak: '/fire.png',
};

const SIZES = {
  xs: 18,
  sm: 24,
  md: 30,
  lg: 40,
  xl: 52,
} as const;

/** Fire is tall — slightly taller box so it is not squashed in chips */
const STREAK_ASPECT = { w: 1, h: 1.12 } as const;

type GameIconProps = {
  kind: GameIconKind;
  size?: keyof typeof SIZES | number;
  className?: string;
  glow?: boolean;
  animate?: boolean;
};

export function GameIcon({ kind, size = 'md', className, glow = false, animate = false }: GameIconProps) {
  const px = typeof size === 'number' ? size : SIZES[size];
  const isStreak = kind === 'streak';
  const w = px;
  const h = isStreak ? Math.round(px * STREAK_ASPECT.h) : px;

  return (
    <span
      className={cn(
        'cy-game-icon-wrap',
        kind === 'streak' && 'cy-game-icon-wrap--fire',
        (kind === 'xp' || kind === 'level') && 'cy-game-icon-wrap--level',
        glow && 'cy-game-icon-wrap--glow',
        animate && 'cy-game-icon-wrap--animate',
        className,
      )}
      style={{ width: w, height: h, minWidth: w }}
      aria-hidden
    >
      <Image
        src={SOURCES[kind]}
        alt=""
        width={w}
        height={h}
        className="cy-game-icon-img"
        unoptimized
      />
    </span>
  );
}

/** XP chip label */
export function XpIcon(props: Omit<GameIconProps, 'kind'>) {
  return <GameIcon kind="xp" {...props} />;
}

/** Streak / fire */
export function StreakIcon(props: Omit<GameIconProps, 'kind'>) {
  return <GameIcon kind="streak" {...props} />;
}

/** Level up */
export function LevelIcon(props: Omit<GameIconProps, 'kind'>) {
  return <GameIcon kind="level" {...props} />;
}
