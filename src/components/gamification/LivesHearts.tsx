'use client';

import { useEffect, useState } from 'react';
import { MAX_LIVES } from '@/lib/gamification';

type LivesHeartsProps = {
  lives: number;
  maxLives?: number;
  nextRefillAt?: number | null;
  compact?: boolean;
  isPremium?: boolean;
  /** Dark game map / quiz background */
  variant?: 'light' | 'dark';
  /** HUD: CSS dots instead of emoji hearts */
  heartStyle?: 'emoji' | 'dots';
};

export function LivesHearts({
  lives,
  maxLives = MAX_LIVES,
  nextRefillAt = null,
  compact = false,
  isPremium = false,
  variant = 'light',
  heartStyle = 'emoji',
}: LivesHeartsProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!nextRefillAt || lives >= maxLives || isPremium) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextRefillAt, lives, maxLives, isPremium]);

  const rem = nextRefillAt ? Math.max(0, nextRefillAt - now) : 0;
  const mins = Math.floor(rem / 60000);
  const secs = Math.floor((rem % 60000) / 1000);

  // Premium: show infinite hearts
  if (isPremium) {
    return (
      <div
        className={`cy-lives${compact ? ' cy-lives--compact' : ''}${variant === 'dark' ? ' cy-lives--dark' : ''}`}
        title="Хязгааргүй амь"
      >
        <div className="cy-lives-hearts" aria-label="Хязгааргүй амь">
          <span className="cy-heart cy-heart--on">❤️</span>
        </div>
        <span className="cy-lives-count" style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>
          ∞
        </span>
      </div>
    );
  }

  return (
    <div
      className={`cy-lives${compact ? ' cy-lives--compact' : ''}${variant === 'dark' ? ' cy-lives--dark' : ''}`}
      title="Амь"
    >
      <div
        className={`cy-lives-hearts${heartStyle === 'dots' ? ' cy-lives-hearts--dots' : ''}`}
        aria-label={`${lives} / ${maxLives} амь`}
      >
        {Array.from({ length: maxLives }).map((_, i) =>
          heartStyle === 'dots' ? (
            <span
              key={i}
              className={i < lives ? 'cy-life-dot cy-life-dot--on' : 'cy-life-dot cy-life-dot--off'}
            />
          ) : (
            <span key={i} className={i < lives ? 'cy-heart cy-heart--on' : 'cy-heart cy-heart--off'}>
              {i < lives ? '❤️' : '🖤'}
            </span>
          ),
        )}
      </div>
      <span className="cy-lives-count">
        {lives}/{maxLives}
      </span>
      {!compact && rem > 0 && lives < maxLives && (
        <span className="cy-lives-timer">
          +1 · {mins}:{secs.toString().padStart(2, '0')}
        </span>
      )}
    </div>
  );
}
