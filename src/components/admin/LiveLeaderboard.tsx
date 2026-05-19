'use client';
import React, { useState, useEffect } from 'react';
import { T } from '@/styles/tokens';
import { Ic, Avatar, Card, Badge } from '@/components/ui';

interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  rank: number;
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_EMOJI = ['🥇', '🥈', '🥉'];

interface Props {
  live?: boolean;
}

export function LiveLeaderboard({ live = false }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/leaderboard');
        if (!r.ok) throw new Error('fail');
        const d = await r.json();
        const entries = Array.isArray(d.entries) ? d.entries : [];
        const mapped: Player[] = entries.map(
          (e: { id: string; name: string; xp: number; streak?: number }, i: number) => ({
            id: e.id,
            name: e.name,
            score: e.xp ?? 0,
            streak: e.streak ?? 0,
            rank: i + 1,
          })
        );
        if (!cancelled) setPlayers(mapped.slice(0, 8));
      } catch {
        if (!cancelled) setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ic n="trophy" size={16} color={T.amber} /> XP жагсаалт
        </div>
        {live && <Badge color={T.green} dot>Шууд</Badge>}
      </div>

      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>Ачаалж байна…</div>
        ) : players.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>Оюутан байхгүй байна</div>
        ) : (
          players.map((p, i) => {
            const isTop3 = i < 3;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  background: isTop3 ? RANK_COLORS[i] + '08' : '#fff',
                  borderBottom: i < players.length - 1 ? `1px solid ${T.border}` : 'none',
                }}
              >
                <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                  {isTop3 ? (
                    <span style={{ fontSize: 18 }}>{RANK_EMOJI[i]}</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.muted }}>{i + 1}</span>
                  )}
                </div>
                <Avatar name={p.name} size={34} color={isTop3 ? RANK_COLORS[i] : T.blue} />
                <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                  {p.name}
                  {p.streak >= 3 && <span style={{ fontSize: 10, marginLeft: 6 }}>🔥×{p.streak}</span>}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>Нийт XP</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: isTop3 ? RANK_COLORS[i] : T.blue }}>{p.score}</span>
                  <span style={{ fontSize: 10, color: T.muted }}>XP</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
