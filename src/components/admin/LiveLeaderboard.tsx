'use client';
import React, { useState, useEffect } from 'react';
import { T } from '@/styles/tokens';
import { Ic, Avatar, Card, Badge } from '@/components/ui';

interface Player {
  id: string; name: string; score: number; streak: number; rank: number; delta: number;
}

const INITIAL_PLAYERS: Player[] = [
  { id: '6', name: 'Номин',    score: 310, streak: 5, rank: 1, delta: 0 },
  { id: '1', name: 'Батбаяр',  score: 340, streak: 4, rank: 2, delta: 1 },
  { id: '2', name: 'Саруул',   score: 280, streak: 3, rank: 3, delta: -1 },
  { id: '4', name: 'Дөлгөөн',  score: 190, streak: 1, rank: 4, delta: 0 },
  { id: '3', name: 'Энхжин',   score: 220, streak: 2, rank: 5, delta: 0 },
  { id: '5', name: 'Мөнхбат',  score: 150, streak: 0, rank: 6, delta: 0 },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_EMOJI  = ['🥇', '🥈', '🥉'];

interface Props { live?: boolean; }

export function LiveLeaderboard({ live = false }: Props) {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);

  // Simulate live updates
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setPlayers(prev => {
        const shuffled = [...prev].map(p => ({
          ...p,
          score: p.score + Math.floor(Math.random() * 20),
        })).sort((a, b) => b.score - a.score).map((p, i) => ({
          ...p,
          rank: i + 1,
          delta: (prev.find(pp => pp.id === p.id)?.rank ?? i + 1) - (i + 1),
        }));
        return shuffled;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [live]);

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ic n="trophy" size={16} color={T.amber} /> Шууд жагсаалт
        </div>
        {live && <Badge color={T.green} dot>Шууд</Badge>}
      </div>

      <div style={{ padding: '8px 0' }}>
        {players.map((p, i) => {
          const isTop3 = i < 3;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: isTop3 ? (RANK_COLORS[i] + '08') : '#fff', borderBottom: i < players.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'all 0.4s ease' }}>
              <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                {isTop3
                  ? <span style={{ fontSize: 18 }}>{RANK_EMOJI[i]}</span>
                  : <span style={{ fontSize: 13, fontWeight: 800, color: T.muted }}>{i + 1}</span>
                }
              </div>
              <Avatar name={p.name} size={34} color={isTop3 ? RANK_COLORS[i] : T.blue} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p.name}
                  {p.streak >= 3 && <span style={{ fontSize: 10 }}>🔥×{p.streak}</span>}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{p.score} оноо</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: isTop3 ? RANK_COLORS[i] : T.blue }}>{p.score}</span>
                {live && p.delta !== 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.delta > 0 ? T.green : T.red, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Ic n="arrowUp" size={10} color={p.delta > 0 ? T.green : T.red} style={{ transform: p.delta < 0 ? 'rotate(180deg)' : undefined }} />
                    {Math.abs(p.delta)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
