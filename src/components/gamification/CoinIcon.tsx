'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const SIZES = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
  xl: 56,
} as const;

type CoinIconProps = {
  size?: keyof typeof SIZES | number;
  className?: string;
  glow?: boolean;
  /** Subtle idle shine animation */
  animate?: boolean;
};

export function CoinIcon({ size = 'md', className, glow = false, animate = false }: CoinIconProps) {
  const px = typeof size === 'number' ? size : SIZES[size];

  return (
    <span
      className={cn(
        'cy-coin-img-wrap',
        glow && 'cy-coin-img-wrap--glow',
        animate && 'cy-coin-img-wrap--animate',
        className,
      )}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <Image
        src="/dollar.png"
        alt=""
        width={px}
        height={px}
        className="cy-coin-img"
        priority={size === 'lg' || size === 'xl'}
      />
    </span>
  );
}
