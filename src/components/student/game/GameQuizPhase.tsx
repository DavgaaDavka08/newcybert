'use client';
import React from 'react';
import type { GameQuestion } from '@/lib/game-data';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? '#FF4B4B' : 'none'} stroke={filled ? '#FF4B4B' : 'rgba(255,255,255,0.2)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

interface Props {
  questions: GameQuestion[];
  topicName: string; topicColor: string; level: number;
  lives: number; maxLives: number; currentQ: number;
  selected: number | null; feedback: 'correct' | 'wrong' | null;
  onSelect: (idx: number) => void; onCheck: () => void; onBack: () => void;
}

export function GameQuizPhase({ questions, topicName, topicColor, level, lives, maxLives, currentQ, selected, feedback, onSelect, onCheck, onBack }: Props) {
  const qObj = questions[currentQ];
  if (!qObj) return null;

  const progress  = (currentQ / questions.length) * 100;
  const isCorrect = feedback === 'correct';
  const isWrong   = feedback === 'wrong';

  function optBg(i: number): string {
    if (!feedback) return selected === i ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
    if (i === qObj.correct) return 'rgba(88,204,2,0.15)';
    if (i === selected && isWrong) return 'rgba(255,75,75,0.15)';
    return 'rgba(255,255,255,0.04)';
  }
  function optBorder(i: number): string {
    if (!feedback) return selected === i ? `2px solid ${topicColor}` : '2px solid rgba(255,255,255,0.1)';
    if (i === qObj.correct) return '2px solid #58CC02';
    if (i === selected && isWrong) return '2px solid #FF4B4B';
    return '2px solid rgba(255,255,255,0.08)';
  }
  function optTextColor(i: number): string {
    if (!feedback) return '#fff';
    if (i === qObj.correct) return '#58CC02';
    if (i === selected && isWrong) return '#FF4B4B';
    return 'rgba(255,255,255,0.3)';
  }
  function labelBg(i: number): string {
    if (!feedback) return selected === i ? topicColor : 'rgba(255,255,255,0.1)';
    if (i === qObj.correct) return '#58CC02';
    if (i === selected && isWrong) return '#FF4B4B';
    return 'rgba(255,255,255,0.06)';
  }
  function labelColor(i: number): string {
    if (!feedback) return selected === i ? '#fff' : 'rgba(255,255,255,0.4)';
    if (i === qObj.correct || (i === selected && isWrong)) return '#fff';
    return 'rgba(255,255,255,0.2)';
  }

  const checkReady = selected !== null && !feedback;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#1c2333', display: 'flex', flexDirection: 'column', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', padding: 4, flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div style={{ flex: 1, height: 14, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: feedback ? (isCorrect ? '#58CC02' : '#FF4B4B') : topicColor, width: `${progress}%`, transition: 'width 0.4s ease, background 0.3s', boxShadow: `0 0 10px ${topicColor}88` }} />
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {Array.from({ length: maxLives }).map((_, i) => <HeartIcon key={i} filled={i < lives} />)}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 16px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: topicColor, background: topicColor + '18', padding: '5px 12px', borderRadius: 99, border: `1px solid ${topicColor}33` }}>
            {topicName} · LEVEL {level}
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1.6, marginBottom: 36, letterSpacing: '-0.01em' }}>{qObj.q}</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {qObj.opts.map((opt, i) => (
            <button key={i} onClick={() => !feedback && onSelect(i)}
              style={{ padding: '16px 20px', borderRadius: 14, border: optBorder(i), background: optBg(i), display: 'flex', alignItems: 'center', gap: 14, fontWeight: 700, fontSize: 16, color: optTextColor(i), cursor: feedback ? 'default' : 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.12s', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => { if (!feedback && selected !== i) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { if (!feedback) (e.currentTarget as HTMLButtonElement).style.background = optBg(i); }}
            >
              <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: labelBg(i), color: labelColor(i), fontSize: 13, fontWeight: 800, border: `1px solid rgba(255,255,255,0.12)`, transition: 'all 0.12s' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom action */}
      {!feedback ? (
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button onClick={onBack} style={{ padding: '14px 28px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.15)', background: 'transparent', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: 0.5 }}>
            АЛГАСАХ
          </button>
          <button onClick={onCheck} disabled={!checkReady} style={{ padding: '14px 48px', borderRadius: 14, border: 'none', fontWeight: 900, fontSize: 15, cursor: checkReady ? 'pointer' : 'not-allowed', fontFamily: 'Plus Jakarta Sans, sans-serif', background: checkReady ? topicColor : 'rgba(255,255,255,0.08)', color: checkReady ? '#fff' : 'rgba(255,255,255,0.25)', boxShadow: checkReady ? `0 6px 20px ${topicColor}55` : 'none', transition: 'all 0.15s', letterSpacing: 0.8 }}>
            ШАЛГАХ
          </button>
        </div>
      ) : (
        <div style={{ flexShrink: 0, background: isCorrect ? 'rgba(88,204,2,0.12)' : 'rgba(255,75,75,0.12)', borderTop: `2px solid ${isCorrect ? '#58CC02' : '#FF4B4B'}`, padding: '20px 28px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {isCorrect
                    ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#58CC02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  }
                  <span style={{ fontWeight: 900, fontSize: 17, color: isCorrect ? '#58CC02' : '#FF4B4B' }}>{isCorrect ? 'Зөв хариулт!' : 'Буруу хариулт'}</span>
                </div>
                {qObj.exp && <div style={{ fontSize: 14, color: isCorrect ? '#86EFAC' : '#FCA5A5', lineHeight: 1.6, paddingLeft: 32 }}>{qObj.exp}</div>}
              </div>
              <button onClick={onCheck} style={{ padding: '14px 36px', borderRadius: 14, border: 'none', flexShrink: 0, fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', background: isCorrect ? '#58CC02' : '#FF4B4B', color: '#fff', boxShadow: isCorrect ? '0 6px 20px rgba(88,204,2,0.5)' : '0 6px 20px rgba(255,75,75,0.5)', letterSpacing: 0.8 }}>
                ҮРГЭЛЖЛҮҮЛЭХ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
