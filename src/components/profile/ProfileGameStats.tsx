'use client';

import { useEffect, useState } from 'react';
import { T } from '@/styles/tokens';
import { CoinIcon, XpIcon, StreakIcon, LivesHearts } from '@/components/gamification';
import { getXpProgress } from '@/lib/gamification';
import { getRank } from '@/lib/ranks';
import { Loading } from '@/components/ui/Loading';

type StatsData = {
  xp: number;
  level: number;
  coins: number;
  lives: number;
  maxLives: number;
  streak: number;
  examAttemptsCount: number;
  avgExamScorePct: number | null;
  progress: ReturnType<typeof getXpProgress>;
  rankName: string;
};

/** Зүүн доод Профайл цонхонд — статистик grid */
export function ProfileGameStats() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/user/gamification').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profile, g]) => {
        if (!profile) return;
        const xp = profile.xp ?? g?.xp ?? 0;
        const progress = g?.progress ?? getXpProgress(xp);
        const level = progress.level;
        setData({
          xp,
          level,
          coins: profile.coins ?? g?.coins ?? 0,
          lives: g?.lives ?? profile.lives ?? 5,
          maxLives: g?.maxLives ?? 5,
          streak: profile.streak ?? g?.streak ?? 0,
          examAttemptsCount: profile.examAttemptsCount ?? 0,
          avgExamScorePct: profile.avgExamScorePct ?? null,
          progress,
          rankName: getRank(xp).name,
        });
      })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
        <Loading size={64} />
      </div>
    );
  }

  const rows = [
    { k: 'XP', v: data.xp.toLocaleString(), icon: <XpIcon size={22} glow /> },
    { k: 'Rank', v: data.rankName, icon: null },
    { k: 'Түвшин', v: `Lv ${data.level}`, icon: null },
    { k: 'Зоос', v: String(data.coins), icon: <CoinIcon size={22} /> },
    { k: 'Амь', v: `${data.lives}/${data.maxLives}`, icon: null, lives: true },
    { k: 'Streak', v: `${data.streak} өдөр`, icon: <StreakIcon size={22} glow /> },
    { k: 'Шалгалт', v: String(data.examAttemptsCount), icon: null },
    {
      k: 'Дундаж оноо',
      v: data.avgExamScorePct != null ? `${data.avgExamScorePct}%` : '—',
      icon: null,
    },
  ];

  return (
    <section className="profile-game-stats">
      <div className="profile-game-stats-grid">
        {rows.map((row) => (
          <div key={row.k} className="profile-game-stats-cell">
            <div className="profile-game-stats-cell-top">
              {'lives' in row && row.lives ? (
                <LivesHearts lives={data.lives} maxLives={data.maxLives} compact />
              ) : (
                row.icon
              )}
              <span className="profile-game-stats-cell-k">{row.k}</span>
            </div>
            <span className="profile-game-stats-cell-v">{row.v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
