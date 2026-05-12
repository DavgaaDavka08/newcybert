'use client';
import React, { useEffect, useState } from 'react';
import { GameMapPhase } from './game/GameMapPhase';
import { GameQuizPhase } from './game/GameQuizPhase';
import { GameResultPhase } from './game/GameResultPhase';
import {
  getTopics, getQuestions, getSettings, getLivesState, setLivesState,
  setNodeStars, calcStars, type GameQuestion, type GameTopic,
} from '@/lib/game-data';
import type { AppState, Screen } from '@/types';

interface Props {
  onNav: (s: Screen) => void;
  state: AppState;
  setState?: (fn: (s: AppState) => AppState) => void;
}

function NoLivesOverlay({ refillAt, coins, refillCoins, livesCount, onRefillCoins, onClose }: {
  refillAt: number | null; coins: number; refillCoins: number; livesCount: number;
  onRefillCoins: () => void; onClose: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const rem  = refillAt ? Math.max(0, refillAt - now) : 0;
  const hrs  = Math.floor(rem / 3_600_000);
  const mins = Math.floor((rem % 3_600_000) / 60_000);
  const secs = Math.floor((rem % 60_000) / 1000);
  const pad  = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ background: '#1c2333', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 36, maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {[0,1,2,3,4].map(i => <svg key={i} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>)}
        </div>
        <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>Амь дууслаа!</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Дараагийн үнэгүй амийн хүртэлх хугацаа:</div>
        {rem > 0 && <div style={{ fontWeight: 900, fontSize: 40, color: '#FF4B4B', letterSpacing: 3, marginBottom: 28, fontVariantNumeric: 'tabular-nums' }}>{hrs > 0 && `${pad(hrs)}:`}{pad(mins)}:{pad(secs)}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onRefillCoins} disabled={coins < refillCoins} style={{ padding: '14px', borderRadius: 12, border: 'none', cursor: coins < refillCoins ? 'not-allowed' : 'pointer', background: coins >= refillCoins ? 'linear-gradient(135deg, #D97706, #B45309)' : 'rgba(255,255,255,0.06)', color: coins >= refillCoins ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {refillCoins} коиноор нөхөх · {livesCount} ❤️
          </button>
          <button onClick={onClose} style={{ padding: '14px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.12)', background: 'transparent', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Буцах</button>
        </div>
        {coins < refillCoins && <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Коин: {coins} / {refillCoins}</div>}
      </div>
    </div>
  );
}

export function GameScreen({ onNav: _onNav, state, setState }: Props) {
  const [topicIdx, setTopicIdx]     = useState(0);
  const [phase, setPhase]           = useState<'map' | 'quiz' | 'result'>('map');
  const [selectedLv, setSelectedLv] = useState<{ topic: GameTopic; level: number } | null>(null);
  const [questions, setQuestions]   = useState<GameQuestion[]>([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [selected, setSelected]     = useState<number | null>(null);
  const [feedback, setFeedback]     = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore]           = useState(0);
  const [mistakes, setMistakes]     = useState(0);
  const [settings]                  = useState(getSettings());
  const [lives, setLives]           = useState(settings.livesCount);
  const [noLives, setNoLives]       = useState(false);
  const [refillAt, setRefillAt]     = useState<number | null>(null);

  useEffect(() => {
    const ls = getLivesState(settings.livesCount);
    if (ls.refillAt && Date.now() >= ls.refillAt) {
      setLives(settings.livesCount);
      setLivesState({ lives: settings.livesCount, refillAt: null });
    } else {
      setLives(ls.lives);
      setRefillAt(ls.refillAt);
    }
  }, [settings.livesCount]);

  function startLevel(topic: GameTopic, level: number) {
    if (lives <= 0) { setNoLives(true); return; }
    const allQs = getQuestions().filter(q => q.topicId === topic.id);
    const PER   = 5;
    const start = ((level - 1) * PER) % Math.max(allQs.length, 1);
    const slice = allQs.length > 0 ? [...allQs, ...allQs].slice(start, start + PER) : getQuestions().slice(0, PER);
    setSelectedLv({ topic, level });
    setQuestions(slice);
    setCurrentQ(0); setSelected(null); setFeedback(null); setScore(0); setMistakes(0);
    setPhase('quiz');
  }

  function handleCheck() {
    if (feedback) {
      setFeedback(null); setSelected(null);
      if (currentQ >= questions.length - 1) {
        if (selectedLv) setNodeStars(selectedLv.topic.id, selectedLv.level - 1, calcStars(mistakes));
        setPhase('result');
      } else {
        setCurrentQ(q => q + 1);
      }
      return;
    }
    if (selected === null) return;
    const qObj = questions[currentQ];
    const ok   = selected === qObj.correct;
    setFeedback(ok ? 'correct' : 'wrong');
    if (ok) {
      setScore(s => s + 1);
      if (setState) setState(s => ({ ...s, xp: s.xp + settings.xpPerCorrect, coins: s.coins + settings.coinsPerCorrect }));
    } else {
      setMistakes(m => m + 1);
      const newLives  = Math.max(0, lives - 1);
      const newRefill = newLives <= 0 ? Date.now() + settings.livesRefillMinutes * 60 * 1000 : null;
      setLives(newLives); setRefillAt(newRefill);
      setLivesState({ lives: newLives, refillAt: newRefill });
      if (setState) setState(s => ({ ...s, lives: newLives }));
      if (newLives <= 0) setTimeout(() => setNoLives(true), 900);
    }
  }

  function handleRefillCoins() {
    if (state.coins < settings.livesRefillCoins) return;
    setLives(settings.livesCount); setRefillAt(null);
    setLivesState({ lives: settings.livesCount, refillAt: null });
    if (setState) setState(s => ({ ...s, coins: s.coins - settings.livesRefillCoins, lives: settings.livesCount }));
    setNoLives(false);
  }

  const topics = getTopics();

  if (phase === 'map') return (
    <>
      <GameMapPhase state={{ ...state, lives }} topicIdx={topicIdx} onTopicIdx={setTopicIdx}
        onSelectLevel={(topicName, level) => {
          const topic = topics.find(t => t.name === topicName) ?? topics[topicIdx] ?? topics[0];
          if (topic) startLevel(topic, level);
        }}
      />
      {noLives && <NoLivesOverlay refillAt={refillAt} coins={state.coins} refillCoins={settings.livesRefillCoins} livesCount={settings.livesCount} onRefillCoins={handleRefillCoins} onClose={() => setNoLives(false)} />}
    </>
  );

  if (phase === 'quiz' && selectedLv) return (
    <>
      <GameQuizPhase questions={questions} topicName={selectedLv.topic.name} topicColor={selectedLv.topic.color} level={selectedLv.level} lives={lives} maxLives={settings.livesCount} currentQ={currentQ} selected={selected} feedback={feedback} onSelect={setSelected} onCheck={handleCheck} onBack={() => setPhase('map')} />
      {noLives && <NoLivesOverlay refillAt={refillAt} coins={state.coins} refillCoins={settings.livesRefillCoins} livesCount={settings.livesCount} onRefillCoins={handleRefillCoins} onClose={() => setNoLives(false)} />}
    </>
  );

  return (
    <GameResultPhase score={score} total={questions.length} mistakes={mistakes} xpEarned={score * settings.xpPerCorrect} coinsEarned={score * settings.coinsPerCorrect} topicName={selectedLv?.topic.name ?? ''} topicColor={selectedLv?.topic.color ?? '#2563EB'} level={selectedLv?.level ?? 1} onBackMap={() => setPhase('map')} onRetry={() => { setCurrentQ(0); setScore(0); setMistakes(0); setSelected(null); setFeedback(null); setPhase('quiz'); }} />
  );
}
