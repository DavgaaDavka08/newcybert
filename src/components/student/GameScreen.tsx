'use client';
import React, { useEffect, useState } from 'react';
import { GameMapPhase } from './game/GameMapPhase';
import { GameQuizPhase } from './game/GameQuizPhase';
import { GameResultPhase } from './game/GameResultPhase';
import {
  getSettings, getLivesState, setLivesState,
  setSubtopicStars, calcStars, hydrateTopicsV2, getTopicsV2,
  type GameQuestion, type GameTopic,
} from '@/lib/game-data';
import { useAppState } from '@/lib/app-state-context';
import { useToast } from '@/components/ui/Toast';
import { PremiumUpsellModal } from '@/components/gamification';
import { COIN_COSTS } from '@/lib/gamification';
import type { AppState, Screen } from '@/types';

const PASS_RATIO = 0.6;

function wipKey(subtopicId: string) {
  return `cp_quiz_wip:${subtopicId}`;
}
function readWip(subtopicId: string): { currentQ: number; score: number; mistakes: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(wipKey(subtopicId));
    if (!raw) return null;
    const o = JSON.parse(raw) as { currentQ?: number; score?: number; mistakes?: number };
    if (typeof o.currentQ !== 'number') return null;
    return { currentQ: o.currentQ, score: Number(o.score) || 0, mistakes: Number(o.mistakes) || 0 };
  } catch {
    return null;
  }
}
function clearWip(subtopicId: string) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(wipKey(subtopicId)); } catch {}
}
function saveWip(subtopicId: string, payload: { currentQ: number; score: number; mistakes: number }) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(wipKey(subtopicId), JSON.stringify(payload)); } catch {}
}

interface Props {
  onNav: (s: Screen) => void;
  state: AppState;
  setState?: (fn: (s: AppState) => AppState) => void;
}

function NoLivesOverlay({
  refillAt,
  coins,
  refillCoins,
  onRefillCoins,
  onClose,
  onPremiumUpsell,
}: {
  refillAt: number | null;
  coins: number;
  refillCoins: number;
  onRefillCoins: () => void;
  onClose: () => void;
  onPremiumUpsell: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const rem = refillAt ? Math.max(0, refillAt - now) : 0;
  const hrs = Math.floor(rem / 3_600_000);
  const mins = Math.floor((rem % 3_600_000) / 60_000);
  const secs = Math.floor((rem % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const canRefill = coins >= refillCoins;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <div
        style={{
          background: '#1c2333',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: 36,
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>Амь дууслаа!</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          Premium — амь хязгааргүй
        </div>
        {rem > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>Үнэгүй +1 амь</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 36,
                color: '#FF4B4B',
                letterSpacing: 2,
                marginBottom: 24,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {hrs > 0 && `${pad(hrs)}:`}
              {pad(mins)}:{pad(secs)}
            </div>
          </>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={onPremiumUpsell}
            style={{
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
            }}
          >
            ⭐ Premium авах
          </button>
          {canRefill && (
            <button
              type="button"
              onClick={onRefillCoins}
              style={{
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #D97706, #B45309)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {refillCoins} зоосоор нөхөх
            </button>
          )}
          {!canRefill && (
            <button
              type="button"
              onClick={onPremiumUpsell}
              style={{
                padding: '12px',
                borderRadius: 12,
                border: '1px solid rgba(251,191,36,0.4)',
                background: 'rgba(245,158,11,0.12)',
                color: '#fcd34d',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              Зоос хүрэлцэхгүй ({coins}/{refillCoins}) — Premium үзэх
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '14px',
              borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Буцах
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameScreen({ onNav, state, setState }: Props) {
  const { refreshStats } = useAppState();
  const toast = useToast();
  const [phase, setPhase]           = useState<'map' | 'quiz' | 'result'>('map');
  const [selectedLv, setSelectedLv] = useState<{ topic: GameTopic; subtopicId: string; lessonName: string } | null>(null);
  const [questions, setQuestions]   = useState<GameQuestion[]>([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [selected, setSelected]     = useState<number | null>(null);
  const [feedback, setFeedback]     = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore]           = useState(0);
  const [mistakes, setMistakes]     = useState(0);
  const [settings]                  = useState(getSettings());
  const PREMIUM_LIVES = 999;
  const effectiveLivesCount = state.isPremium ? PREMIUM_LIVES : settings.livesCount;
  const [lives, setLives]           = useState(state.isPremium ? PREMIUM_LIVES : settings.livesCount);
  const [noLives, setNoLives]       = useState(false);
  const [premiumUpsell, setPremiumUpsell] = useState(false);
  const [refillAt, setRefillAt]     = useState<number | null>(null);
  const healCoinCost = COIN_COSTS.full_heal;
  const [mapReload, setMapReload]   = useState(0);
  const [resumePrompt, setResumePrompt] = useState<{
    subtopicId: string;
    topic: GameTopic;
    lessonName: string;
    wip: { currentQ: number; score: number; mistakes: number };
  } | null>(null);
  const [resultReward, setResultReward] = useState({ xp: 0, coins: 0 });

  function applyServerStats(d: { xp?: number; coins?: number; level?: number } | null) {
    if (!d || !setState) return;
    setState((s) => ({
      ...s,
      xp: d.xp ?? s.xp,
      coins: d.coins ?? s.coins,
      level: d.level ?? s.level,
    }));
    refreshStats();
  }

  function awardSubtopicStart(topicId: string, subtopicId: string) {
    fetch('/api/game/subtopic-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopicId, topicId, awardStart: true, passed: false, perfect: false }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => applyServerStats(d))
      .catch(() => {});
  }

  function awardSubtopicComplete(topicId: string, subtopicId: string, perfect: boolean) {
    return fetch('/api/game/subtopic-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopicId, topicId, passed: true, perfect, awardStart: false }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setResultReward({ xp: d.xpAdded ?? 0, coins: d.coinsAdded ?? 0 });
          applyServerStats(d);
        }
        return d;
      });
  }

  useEffect(() => {
    void hydrateTopicsV2().finally(() => setMapReload(r => r + 1));
  }, []);

  useEffect(() => {
    if (state.isPremium) {
      setLives(PREMIUM_LIVES);
      return;
    }
    fetch('/api/user/lives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setLives(d.lives);
          setRefillAt(d.nextRefillAt);
          setLivesState({ lives: d.lives, refillAt: d.nextRefillAt });
          if (setState) setState((s) => ({ ...s, lives: d.lives }));
          return;
        }
        const ls = getLivesState(settings.livesCount);
        setLives(ls.lives);
        setRefillAt(ls.refillAt);
      })
      .catch(() => {
        const ls = getLivesState(settings.livesCount);
        setLives(ls.lives);
        setRefillAt(ls.refillAt);
      });
  }, [settings.livesCount, state.isPremium, setState]);

  function enterQuiz(
    topic: GameTopic,
    subtopicId: string,
    lessonName: string,
    slice: GameQuestion[],
    resume?: { currentQ: number; score: number; mistakes: number },
  ) {
    if (!resume) clearWip(subtopicId);
    setSelectedLv({ topic, subtopicId, lessonName });
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
    setResultReward({ xp: 0, coins: 0 });
    setPhase('quiz');
    if (!resume) {
      awardSubtopicStart(topic.id, subtopicId);
    }
  }

  async function startSubtopicLevel(topicName: string, subtopicId: string) {
    if (!state.isPremium && lives <= 0) { setNoLives(true); return; }
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
      if (!qs.length) {
        toast.warning('Энэ хичээлд асуулт байхгүй. Админ хэсэгт асуулт нэмнэ үү.', 'Хичээл');
        return;
      }
      const v2topics = getTopicsV2();
      const v2topic = v2topics.find(t => t.name === topicName);
      const sub = v2topic?.subtopics.find(s => s.id === subtopicId);
      const syntheticTopic: GameTopic = {
        id: v2topic?.id ?? subtopicId,
        name: topicName,
        color: v2topic?.color ?? '#2563EB',
        icon: v2topic?.icon ?? 'Φ',
      };
      const lessonName = sub?.name ?? d.subtopicName ?? topicName;
      const wip = readWip(subtopicId);
      if (wip && wip.currentQ > 0 && wip.currentQ < qs.length) {
        setResumePrompt({ subtopicId, topic: syntheticTopic, lessonName, wip });
        return;
      }
      enterQuiz(syntheticTopic, subtopicId, lessonName, qs);
    } catch {
      toast.error('Асуулт ачаалахад алдаа гарлаа');
    }
  }

  function confirmResumeContinue() {
    if (!resumePrompt) return;
    const { subtopicId, topic, lessonName, wip } = resumePrompt;
    setResumePrompt(null);
    void (async () => {
      const r = await fetch(`/api/game/subtopic-questions/${subtopicId}`);
      const d = await r.json();
      const qs: GameQuestion[] = (d.questions ?? []).map((q: { id: string; q: string; opts: string[]; correct: number; exp: string }) => ({
        id: q.id, topicId: subtopicId, q: q.q, opts: q.opts, correct: q.correct, exp: q.exp,
      }));
      enterQuiz(topic, subtopicId, lessonName, qs, wip);
    })();
  }

  function confirmResumeFresh() {
    if (!resumePrompt) return;
    const { subtopicId, topic, lessonName } = resumePrompt;
    clearWip(subtopicId);
    setResumePrompt(null);
    void (async () => {
      const r = await fetch(`/api/game/subtopic-questions/${subtopicId}`);
      const d = await r.json();
      const qs: GameQuestion[] = (d.questions ?? []).map((q: { id: string; q: string; opts: string[]; correct: number; exp: string }) => ({
        id: q.id, topicId: subtopicId, q: q.q, opts: q.opts, correct: q.correct, exp: q.exp,
      }));
      enterQuiz(topic, subtopicId, lessonName, qs);
    })();
  }

  function handleCheck() {
    if (feedback) {
      setFeedback(null); setSelected(null);
      if (currentQ >= questions.length - 1) {
        const total = questions.length;
        const passed = total > 0 && score / total >= PASS_RATIO;
        if (passed && selectedLv) {
          setSubtopicStars(selectedLv.subtopicId, calcStars(mistakes));
          clearWip(selectedLv.subtopicId);
          const perfect = score === total && mistakes === 0;
          void awardSubtopicComplete(selectedLv.topic.id, selectedLv.subtopicId, perfect);
        } else {
          setResultReward({ xp: 0, coins: 0 });
        }
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
    } else {
      setMistakes(m => m + 1);
      if (!state.isPremium) {
        fetch('/api/user/lives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'lose' }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d) return;
            setLives(d.lives);
            setRefillAt(d.nextRefillAt);
            setLivesState({ lives: d.lives, refillAt: d.nextRefillAt });
            if (setState) setState((s) => ({ ...s, lives: d.lives }));
            if (d.lives <= 0) setTimeout(() => setNoLives(true), 900);
          })
          .catch(() => {
            const newLives = Math.max(0, lives - 1);
            const newRefill = newLives <= 0 ? Date.now() + settings.livesRefillMinutes * 60 * 1000 : null;
            setLives(newLives);
            setRefillAt(newRefill);
            setLivesState({ lives: newLives, refillAt: newRefill });
            if (setState) setState((s) => ({ ...s, lives: newLives }));
            if (newLives <= 0) setTimeout(() => setNoLives(true), 900);
          });
      }
    }
  }

  function handleRefillCoins() {
    if (state.coins < healCoinCost) {
      setPremiumUpsell(true);
      return;
    }
    fetch('/api/user/spend-coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'full_heal' }),
    })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as { success?: boolean; coins?: number; error?: string };
        if (!r.ok || !d.success) {
          setPremiumUpsell(true);
          return;
        }
        setLives(settings.livesCount);
        setRefillAt(null);
        setLivesState({ lives: settings.livesCount, refillAt: null });
        if (setState) setState((s) => ({ ...s, coins: d.coins ?? s.coins, lives: settings.livesCount }));
        setNoLives(false);
        refreshStats();
      })
      .catch(() => setPremiumUpsell(true));
  }

  if (phase === 'map') return (
    <>
      <GameMapPhase
        state={state}
        mapLives={state.isPremium ? effectiveLivesCount : lives}
        maxLives={effectiveLivesCount}
        nextRefillAt={state.isPremium ? null : refillAt}
        topicIdx={0}
        onTopicIdx={() => {}}
        reloadSignal={mapReload}
        onBackToDashboard={() => onNav('dashboard')}
        onSelectLevel={(topicName, subtopicId) => {
          if (typeof subtopicId === 'string') {
            void startSubtopicLevel(topicName, subtopicId);
          }
        }}
      />
      {resumePrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 350, background: 'rgba(5,10,22,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '32px 28px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#0f172a', marginBottom: 10 }}>{resumePrompt.lessonName}</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, marginBottom: 22 }}>
              Та <span style={{ fontWeight: 900, color: '#7c3aed' }}>{resumePrompt.wip.currentQ + 1}-р асуулт</span> хүртэл хүрсэн байна.
            </div>
            <button type="button" onClick={confirmResumeContinue} style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 10, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Үргэлжлүүлэх
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
      {noLives && !state.isPremium && (
        <NoLivesOverlay
          refillAt={refillAt}
          coins={state.coins}
          refillCoins={healCoinCost}
          onRefillCoins={handleRefillCoins}
          onClose={() => setNoLives(false)}
          onPremiumUpsell={() => setPremiumUpsell(true)}
        />
      )}
      <PremiumUpsellModal
        open={premiumUpsell && !state.isPremium}
        onClose={() => setPremiumUpsell(false)}
        reason="lives"
        balance={state.coins}
        refillCoinCost={healCoinCost}
        nextRefillAt={refillAt}
      />
    </>
  );

  if (phase === 'quiz' && selectedLv) return (
    <>
      <GameQuizPhase questions={questions} topicName={selectedLv.lessonName} topicColor={selectedLv.topic.color} level={1} lives={state.isPremium ? PREMIUM_LIVES : lives} maxLives={effectiveLivesCount} currentQ={currentQ} selected={selected} feedback={feedback} onSelect={setSelected} onCheck={handleCheck} onBack={() => {
        saveWip(selectedLv.subtopicId, { currentQ, score, mistakes });
        setPhase('map');
      }} />
      {noLives && !state.isPremium && (
        <NoLivesOverlay
          refillAt={refillAt}
          coins={state.coins}
          refillCoins={healCoinCost}
          onRefillCoins={handleRefillCoins}
          onClose={() => setNoLives(false)}
          onPremiumUpsell={() => setPremiumUpsell(true)}
        />
      )}
      <PremiumUpsellModal
        open={premiumUpsell && !state.isPremium}
        onClose={() => setPremiumUpsell(false)}
        reason="lives"
        balance={state.coins}
        refillCoinCost={healCoinCost}
        nextRefillAt={refillAt}
      />
    </>
  );

  const totalQ = questions.length;
  const passed = totalQ > 0 && score / totalQ >= PASS_RATIO;

  return (
    <GameResultPhase
      score={score}
      total={totalQ}
      mistakes={mistakes}
      xpEarned={resultReward.xp}
      coinsEarned={resultReward.coins}
      topicName={selectedLv?.lessonName ?? ''}
      topicColor={selectedLv?.topic.color ?? '#2563EB'}
      level={1}
      passed={passed}
      onBackMap={() => setPhase('map')}
      onRetry={() => {
        if (selectedLv) clearWip(selectedLv.subtopicId);
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
