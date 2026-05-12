'use client';
import React, { useState } from 'react';
import { T } from '@/styles/tokens';
import { Ic, Avatar, Badge, Btn, Card } from '@/components/ui';

interface Player {
  id: string; name: string; score: number; streak: number;
  isConnected: boolean; answered: boolean; isCorrect?: boolean;
  answeredAt?: number;
}

const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Батбаяр',  score: 340, streak: 4, isConnected: true,  answered: true,  isCorrect: true,  answeredAt: 4200 },
  { id: '2', name: 'Саруул',   score: 280, streak: 3, isConnected: true,  answered: true,  isCorrect: true,  answeredAt: 8100 },
  { id: '3', name: 'Энхжин',   score: 220, streak: 2, isConnected: true,  answered: false },
  { id: '4', name: 'Дөлгөөн',  score: 190, streak: 1, isConnected: true,  answered: true,  isCorrect: false, answeredAt: 15000 },
  { id: '5', name: 'Мөнхбат',  score: 150, streak: 0, isConnected: false, answered: false },
  { id: '6', name: 'Номин',    score: 310, streak: 5, isConnected: true,  answered: true,  isCorrect: true,  answeredAt: 2900 },
];

interface Props { sessionActive?: boolean; onKick?: (id: string) => void; }

export function ConnectedStudents({ sessionActive = false, onKick }: Props) {
  const [players] = useState<Player[]>(MOCK_PLAYERS);
  const [search, setSearch]   = useState('');

  const filtered    = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const connected   = players.filter(p => p.isConnected).length;
  const answered    = players.filter(p => p.answered).length;
  const correct     = players.filter(p => p.isCorrect).length;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic n="users" size={16} color={T.blue} /> Холбогдсон сурагчид
          </div>
          <Badge color={T.green} dot>{connected} онлайн</Badge>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Нийт', val: players.length, color: T.blue },
            { label: 'Хариулсан', val: answered, color: T.amber },
            { label: 'Зөв', val: correct, color: T.green },
          ].map((s, i) => (
            <div key={i} style={{ background: s.color + '0a', borderRadius: 10, padding: '10px', textAlign: 'center', border: `1px solid ${s.color}22` }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Answer progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textSub }}>Хариулах явц</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.blue }}>{answered}/{connected}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${T.green}, ${T.blue})`, width: `${connected > 0 ? (answered / connected) * 100 : 0}%`, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 12 }}>
          <Ic n="search" size={14} color={T.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хайх..."
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', color: T.text, background: '#FAFBFC', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Player list */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {filtered.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', background: p.answered ? (p.isCorrect ? T.greenLight : T.redLight) : '#fff', transition: 'background 0.3s' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={p.name} size={36} color={p.isConnected ? T.blue : T.muted} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: p.isConnected ? T.green : T.muted, border: '2px solid #fff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                {p.name}
                {p.streak > 2 && <span style={{ fontSize: 10 }}>🔥 {p.streak}</span>}
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>{p.score} очно</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {sessionActive && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: p.answered ? (p.isCorrect ? T.green + '18' : T.red + '18') : T.border, color: p.answered ? (p.isCorrect ? T.green : T.red) : T.muted }}>
                  {p.answered ? (p.isCorrect ? '✓ Зөв' : '✗ Буруу') : '...'}
                </span>
              )}
              {p.answeredAt && <span style={{ fontSize: 10, color: T.muted }}>{(p.answeredAt / 1000).toFixed(1)}с</span>}
              {onKick && (
                <Btn onClick={() => onKick(p.id)} color={T.red} variant="ghost" size="sm">
                  <Ic n="xCircle" size={12} color={T.red} />
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
