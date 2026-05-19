'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GameMapPhase } from './game/GameMapPhase';
import { GameQuizPhase } from './game/GameQuizPhase';
import { GameResultPhase } from './game/GameResultPhase';
import { GamePathAdminPanel } from './game/GamePathAdminPanel';
import {
  getTopics, getQuestions, getSettings, getLivesState, setLivesState,
  setNodeStars, calcStars, hydrateGamePathFromApi, hydrateTopicsV2, getLessonSequence,
  getTopicsV2, setSubtopicStars,
  type GameQuestion, type GameTopic,
} from '@/lib/game-data';
import { useAppState } from '@/lib/app-state-context';
import type { AppState, Screen } from '@/types';

const PASS_RATIO = 0.6;

function wipKey(topicId: string, level: number) {
  return `cp_quiz_wip:${topicId}:${level}`;
}
function readWip(topicId: string, level: number): { currentQ: number; score: number; mistakes: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(wipKey(topicId, level));
    if (!raw) return null;
    const o = JSON.parse(raw) as { currentQ?: number; score?: number; mistakes?: number };
    if (typeof o.currentQ !== 'number') return null;
    return { currentQ: o.currentQ, score: Number(o.score) || 0, mistakes: Number(o.mistakes) || 0 };
  } catch {
    return null;
  }
}
function clearWip(topicId: string, level: number) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(wipKey(topicId, level)); } catch {}
}
function saveWip(topicId: string, level: number, payload: { currentQ: number; score: number; mistakes: number }) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(wipKey(topicId, level), JSON.stringify(payload)); } catch {}
}

function buildLevelQuestions(topic: GameTopic, level: number): GameQuestion[] {
  const allQs = getQuestions().filter(q => q.topicId === topic.id);
  const PER   = 5;
  const start = ((level - 1) * PER) % Math.max(allQs.length, 1);
  return allQs.length > 0 ? [...allQs, ...allQs].slice(start, start + PER) : getQuestions().slice(0, PER);
}

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
  const { data: session } = useSession();
  const { refreshStats } = useAppState();
  const isAdmin = session?.user?.role === 'admin';
  const [topicIdx, setTopicIdx]     = useState(0);
  const [phase, setPhase]           = useState<'map' | 'quiz' | 'result'>('map');
  const [selectedLv, setSelectedLv] = useState<{ topic: GameTopic; level: number; subtopicId?: string } | null>(null);
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
  const [mapReload, setMapReload]   = useState(0);
  const [resumePrompt, setResumePrompt] = useState<{
    topic: GameTopic; level: number;
    wip: { currentQ: number; score: number; mistakes: number };
  } | null>(null);

  useEffect(() => {
    // Try V2 (DB-driven subtopics) first, fall back to legacy path
    void hydrateTopicsV2().then(ok => {
      if (!ok) return hydrateGamePathFromApi();
    }).finally(() => setMapReload(r => r + 1));
  }, []);

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

  function enterQuiz(topic: GameTopic, level: number, slice: GameQuestion[], resume?: { currentQ: number; score: number; mistakes: number }, subtopicId?: string) {
    if (!resume) clearWip(topic.id, level);
    setSelectedLv({ topic, level, subtopicId });
    setQuestions(slice);
    if (resume) {
      setCurrentQ(resume.currentQ);
      setScore(resume.score);
      setMistakes(resume.mistakes);
    } else {
      setCurrentQ(0);
      setScore(0);
      setMistakes(0);
    }
    setSelected(null);
    setFeedback(null);
    setPhase('quiz');
  }

  function startLevel(topic: GameTopic, level: number) {
    if (lives <= 0) { setNoLives(true); return; }
    const slice = buildLevelQuestions(topic, level);
    const wip = readWip(topic.id, level);
    if (wip && wip.currentQ > 0 && wip.currentQ < slice.length) {
      setResumePrompt({ topic, level, wip });
      return;
    }
    enterQuiz(topic, level, slice);
  }

  async function startSubtopicLevel(topicName: string, subtopicId: string) {
    if (lives <= 0) { setNoLives(true); return; }
    try {
      const r = await fetch(`/api/game/subtopic-questions/${subtopicId}`);
      const d = await r.json();
      const qs: GameQuestion[] = (d.questions ?? []).map((q: { id: string; q: string; opts: string[]; correct: number; exp: string }) => ({
        id: q.id,
        topicId: subtopicId,
        q: q.q,
        opts: q.opts,
        correct: q.correct,
        exp: q.exp,
      }));
      if (!qs.length) return; // no questions yet
      // Build a synthetic GameTopic for this subtopic context
      const v2topics = getTopicsV2();
      const v2topic = v2topics.find(t => t.name === topicName) ?? v2topics[0];
      const syntheticTopic: GameTopic = {
        id: subtopicId,
        name: topicName,
        color: v2topic?.color ?? '#2563EB',
        icon: v2topic?.icon ?? '⚡',
      };
      enterQuiz(syntheticTopic, 1, qs, undefined, subtopicId);
    } catch {
      // silently fail
    }
  }

  function confirmResumeContinue() {
    if (!resumePrompt) return;
    const { topic, level, wip } = resumePrompt;
    const slice = buildLevelQuestions(topic, level);
    setResumePrompt(null);
    enterQuiz(topic, level, slice, wip);
  }

  function confirmResumeFresh() {
    if (!resumePrompt) return;
    const { topic, level } = resumePrompt;
    clearWip(topic.id, level);
    const slice = buildLevelQuestions(topic, level);
    setResumePrompt(null);
    enterQuiz(topic, level, slice);
  }

  function handleCheck() {
    if (feedback) {
      setFeedback(null); setSelected(null);
      if (currentQ >= questions.length - 1) {
        const total = questions.length;
        const passed = total > 0 && score / total >= PASS_RATIO;
        if (passed && selectedLv) {
          if (selectedLv.subtopicId) {
            setSubtopicStars(selectedLv.subtopicId, calcStars(mistakes));
          } else {
            setNodeStars(selectedLv.topic.id, selectedLv.level - 1, calcStars(mistakes));
          }
          clearWip(selectedLv.topic.id, selectedLv.level);
        }
        setPhase('result');
        refreshStats();
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
      // Sync to server every correct answer
      fetch('/api/user/award-xp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ xp: settings.xpPerCorrect, coins: settings.coinsPerCorrect, reason: 'practice_correct' }) }).catch(() => {});
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
      {isAdmin && (
        <GamePathAdminPanel
          onSaved={() => {
            void hydrateGamePathFromApi().finally(() => setMapReload(r => r + 1));
          }}
        />
      )}
      <GameMapPhase state={{ ...state, lives }} topicIdx={topicIdx} onTopicIdx={setTopicIdx} reloadSignal={mapReload}
        onSelectLevel={(topicName, level) => {
          // V2: subtopicId is passed as a string
          if (typeof level === 'string') {
            void startSubtopicLevel(topicName, level);
            return;
          }
          const topic = topics.find(t => t.name === topicName) ?? topics[topicIdx] ?? topics[0];
          if (topic) startLevel(topic, level);
        }}
      />
      {resumePrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(5,10,22,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '32px 28px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 12 }}>📚</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#0f172a', marginBottom: 10 }}>{getLessonSequence()[resumePrompt.level - 1]?.title ?? resumePrompt.topic.name}</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, marginBottom: 22 }}>
              Та <span style={{ fontWeight: 900, color: '#7c3aed' }}>{resumePrompt.wip.currentQ + 1}-р асуулт</span> хүртэл хүрсэн байна. Хаанаас үргэлжлүүлэх вэ?
            </div>
            <button type="button" onClick={confirmResumeContinue} style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 10, fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
              ▶ {resumePrompt.wip.currentQ + 1}-р асуултаас үргэлжлүүлэх
            </button>
            <button type="button" onClick={confirmResumeFresh} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Эхнээс эхлэх
            </button>
            <button type="button" onClick={() => setResumePrompt(null)} style={{ marginTop: 8, width: '100%', padding: '10px', border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Болих
            </button>
          </div>
        </div>
      )}
      {noLives && <NoLivesOverlay refillAt={refillAt} coins={state.coins} refillCoins={settings.livesRefillCoins} livesCount={settings.livesCount} onRefillCoins={handleRefillCoins} onClose={() => setNoLives(false)} />}
    </>
  );

  if (phase === 'quiz' && selectedLv) return (
    <>
      <GameQuizPhase questions={questions} topicName={selectedLv.topic.name} topicColor={selectedLv.topic.color} level={selectedLv.level} lives={lives} maxLives={settings.livesCount} currentQ={currentQ} selected={selected} feedback={feedback} onSelect={setSelected} onCheck={handleCheck} onBack={() => {
        saveWip(selectedLv.topic.id, selectedLv.level, { currentQ, score, mistakes });
        setPhase('map');
      }} />
      {noLives && <NoLivesOverlay refillAt={refillAt} coins={state.coins} refillCoins={settings.livesRefillCoins} livesCount={settings.livesCount} onRefillCoins={handleRefillCoins} onClose={() => setNoLives(false)} />}
    </>
  );

  const totalQ = questions.length;
  const passed = totalQ > 0 && score / totalQ >= PASS_RATIO;

  return (
    <GameResultPhase
      score={score}
      total={totalQ}
      mistakes={mistakes}
      xpEarned={score * settings.xpPerCorrect}
      coinsEarned={score * settings.coinsPerCorrect}
      topicName={selectedLv?.topic.name ?? ''}
      topicColor={selectedLv?.topic.color ?? '#2563EB'}
      level={selectedLv?.level ?? 1}
      passed={passed}
      onBackMap={() => setPhase('map')}
      onRetry={() => {
        if (selectedLv) clearWip(selectedLv.topic.id, selectedLv.level);
        setCurrentQ(0);
        setScore(0);
        setMistakes(0);
        setSelected(null);
        setFeedback(null);
        setPhase('quiz');
      }}
    />
  );
}
