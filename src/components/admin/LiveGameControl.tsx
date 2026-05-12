'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { T } from '@/styles/tokens';
import { Ic, Btn, Badge, Card } from '@/components/ui';

interface GameSession {
  id: string;
  pin: string;
  topic: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  playerCount: number;
  currentQ: number;
  totalQ: number;
  timer: number;
  announcement?: string;
}

const TOPICS = [
  { id: 't1', name: 'Цахилгаан',    color: '#2563EB' },
  { id: 't2', name: 'Механик',       color: '#D97706' },
  { id: 't3', name: 'Дулаан',        color: '#DC2626' },
  { id: 't4', name: 'Соронзон',      color: '#7C3AED' },
  { id: 't5', name: 'Хэмжигдэхүүн', color: '#0D9488' },
];

function generatePIN() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

interface Props { onSessionChange?: (session: GameSession | null) => void; }

export function LiveGameControl({ onSessionChange }: Props) {
  const [session, setSession]           = useState<GameSession | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);
  const [announcement, setAnnouncement]   = useState('');
  const [timerValue, setTimerValue]       = useState(30);
  const [countdown, setCountdown]         = useState<number | null>(null);

  const updateSession = useCallback((update: Partial<GameSession>) => {
    setSession(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...update };
      onSessionChange?.(next);
      return next;
    });
  }, [onSessionChange]);

  // Countdown tick
  useEffect(() => {
    if (!session || session.status !== 'active' || countdown === null) return;
    if (countdown <= 0) { updateSession({ timer: 0 }); return; }
    const id = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown, session, updateSession]);

  function createSession() {
    const topic = TOPICS.find(t => t.id === selectedTopic) ?? TOPICS[0];
    const s: GameSession = { id: `sess_${Date.now()}`, pin: generatePIN(), topic: topic.name, status: 'waiting', playerCount: 0, currentQ: 0, totalQ: 10, timer: timerValue };
    setSession(s);
    onSessionChange?.(s);
  }

  function startGame()  { updateSession({ status: 'active' }); setCountdown(timerValue); }
  function pauseGame()  { updateSession({ status: 'paused' }); setCountdown(null); }
  function resumeGame() { updateSession({ status: 'active' }); setCountdown(timerValue); }
  function endGame()    { updateSession({ status: 'finished' }); setCountdown(null); }
  function nextQuestion() {
    if (!session) return;
    const next = Math.min(session.currentQ + 1, session.totalQ - 1);
    updateSession({ currentQ: next, timer: timerValue });
    setCountdown(timerValue);
  }
  function sendAnnouncement() {
    if (!announcement.trim()) return;
    updateSession({ announcement: announcement.trim() });
    setAnnouncement('');
  }

  const statusColor: Record<string, string> = { waiting: T.amber, active: T.green, paused: T.purple, finished: T.muted };

  if (!session) {
    return (
      <Card style={{ padding: 28 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 20 }}>🎮 Шинэ тоглолт үүсгэх</div>

        {/* Topic selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Сэдэв сонгох</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setSelectedTopic(t.id)} style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${selectedTopic === t.id ? t.color : T.border}`, background: selectedTopic === t.id ? t.color + '12' : '#fff', color: selectedTopic === t.id ? t.color : T.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.13s' }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Timer setting */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Асуултын хугацаа (секунд)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[15, 20, 30, 45, 60].map(v => (
              <button key={v} onClick={() => setTimerValue(v)} style={{ width: 48, height: 40, borderRadius: 10, border: `2px solid ${timerValue === v ? T.blue : T.border}`, background: timerValue === v ? T.blueLight : '#fff', color: timerValue === v ? T.blue : T.textSub, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.13s' }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <Btn onClick={createSession} color={T.blue} size="lg" full style={{ fontWeight: 800 }}>
          <Ic n="play" size={16} color="#fff" /> Тоглолт үүсгэх
        </Btn>
      </Card>
    );
  }

  const topic   = TOPICS.find(t => t.name === session.topic) ?? TOPICS[0];
  const statusC = statusColor[session.status] ?? T.muted;
  const statusLabel: Record<string, string> = { waiting: 'Хүлээж байна', active: 'Идэвхтэй', paused: 'Тасалдсан', finished: 'Дууссан' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Session header card */}
      <div style={{ background: `linear-gradient(120deg, ${topic.color}22, ${topic.color}08)`, border: `1.5px solid ${topic.color}30`, borderRadius: 18, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Одоогийн тоглолт</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: T.text }}>📡 {session.topic}</div>
          </div>
          <Badge color={statusC} dot>{statusLabel[session.status]}</Badge>
        </div>

        {/* PIN + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Game PIN', val: session.pin, icon: 'lock', color: topic.color, big: true },
            { label: 'Тоглогчид', val: String(session.playerCount), icon: 'users', color: T.blue },
            { label: 'Асуулт', val: `${session.currentQ + 1}/${session.totalQ}`, icon: 'task', color: T.purple },
            { label: 'Хугацаа', val: countdown !== null ? `${countdown}с` : `${timerValue}с`, icon: 'history', color: countdown !== null && countdown < 5 ? T.red : T.green },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Ic n={s.icon} size={15} color={s.color} />
              </div>
              <div style={{ fontWeight: 900, fontSize: s.big ? 20 : 18, color: T.text, letterSpacing: s.big ? '0.06em' : '-0.02em' }}>{s.val}</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {session.status === 'waiting' && <Btn onClick={startGame} color={T.green} size="md" style={{ flex: 1 }}><Ic n="play" size={14} color="#fff" /> Эхлэх</Btn>}
          {session.status === 'active'  && <Btn onClick={pauseGame} color={T.amber} size="md" style={{ flex: 1 }}><Ic n="pause" size={14} color="#fff" /> Зогсоох</Btn>}
          {session.status === 'paused'  && <Btn onClick={resumeGame} color={T.green} size="md" style={{ flex: 1 }}><Ic n="play" size={14} color="#fff" /> Үргэлжлүүлэх</Btn>}
          {(session.status === 'active' || session.status === 'paused') && (
            <Btn onClick={nextQuestion} color={T.blue} size="md" style={{ flex: 1 }}><Ic n="chevRight" size={14} color="#fff" /> Дараагийн асуулт</Btn>
          )}
          <Btn onClick={endGame} color={T.red} variant="outline" size="md"><Ic n="stop" size={14} color={T.red} /> Дуусгах</Btn>
          <Btn onClick={() => setSession(null)} color={T.muted} variant="ghost" size="md">Шинэ тоглолт</Btn>
        </div>
      </div>

      {/* Progress bar */}
      {session.status === 'active' && countdown !== null && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>Хугацааны тоолуур</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: countdown < 5 ? T.red : T.green }}>{countdown}с</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: countdown < 5 ? T.red : T.green, width: `${(countdown / timerValue) * 100}%`, transition: 'width 1s linear, background 0.3s' }} />
          </div>
        </div>
      )}

      {/* Announcement */}
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 10 }}>📢 Зарлал илгээх</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={announcement} onChange={e => setAnnouncement(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAnnouncement()}
            placeholder="Сурагчдад зарлал илгээх..."
            style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', color: T.text, background: '#FAFBFC' }}
          />
          <Btn onClick={sendAnnouncement} color={T.blue} size="md"><Ic n="send" size={14} color="#fff" /></Btn>
        </div>
        {session.announcement && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: T.blueLight, border: `1px solid ${T.blueMuted}`, fontSize: 12, color: T.blue, fontWeight: 600 }}>
            📢 {session.announcement}
          </div>
        )}
      </Card>
    </div>
  );
}
