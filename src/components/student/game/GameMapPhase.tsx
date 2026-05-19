'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Ic } from '@/components/ui';
import {
  getTopics, getStars, getSettings, LEVELS_PER_TOPIC,
  getLessonSequence,
  type LessonType, type GameTopic,
} from '@/lib/game-data';
import type { AppState } from '@/types';

type TopicState = 'completed' | 'active' | 'locked';

type OffsetType = 'center' | 'off-l' | 'off-l2' | 'off-r' | 'off-r2';
const NODE_OFFSETS: OffsetType[] = ['center','off-l','off-r','center','off-l2','off-r','center','off-l','off-r2','center'];
const OFFSET_STYLES: Record<OffsetType, React.CSSProperties> = {
  center: { justifyContent: 'center' },
  'off-l':  { justifyContent: 'flex-start', paddingLeft: 72 },
  'off-l2': { justifyContent: 'flex-start', paddingLeft: 24 },
  'off-r':  { justifyContent: 'flex-end',   paddingRight: 72 },
  'off-r2': { justifyContent: 'flex-end',   paddingRight: 24 },
};

const TYPE_BADGE: Record<LessonType, { bg: string; color: string } | null> = {
  lesson: null, quiz: { bg: '#fef3c7', color: '#92400e' }, lab: { bg: '#e0f2fe', color: '#075985' },
  boss: { bg: '#fee2e2', color: '#991b1b' }, review: { bg: '#ede9fe', color: '#5b21b6' },
};
const TYPE_COLOR: Record<LessonType, string | null> = {
  lesson: null, quiz: '#f59e0b', lab: '#0ea5e9', boss: '#ef4444', review: '#8b5cf6',
};
const TYPE_LABEL: Record<LessonType, string | null> = {
  lesson: null, quiz: 'СОРИЛ', lab: 'ТУРШИЛТ', boss: 'ДАРГА', review: 'ДҮГНЭЛТ',
};

function isTopicFullyDone(topicId: string, stars: Record<string, number[]>): boolean {
  const ts = stars[topicId] ?? [];
  for (let i = 0; i < LEVELS_PER_TOPIC; i++) {
    if ((ts[i] ?? 0) <= 0) return false;
  }
  return true;
}
function getTopicState(topicId: string, stars: Record<string, number[]>): TopicState {
  const ts = stars[topicId] ?? [];
  const done = ts.filter(s => s > 0).length;
  if (done >= LEVELS_PER_TOPIC) return 'completed';
  if (done > 0) return 'active';
  return 'locked';
}

// ── Atmosphere ────────────────────────────────────────────────
const FORMULA_ITEMS = [
  { top: '5%',  left: '6%',  size: 64, anim: 'atm-f1 14s ease-in-out infinite'  },
  { top: '18%', left: '78%', size: 42, anim: 'atm-f2 16s ease-in-out infinite'  },
  { top: '38%', left: '3%',  size: 80, anim: 'atm-f1 18s ease-in-out infinite'  },
  { top: '55%', left: '88%', size: 52, anim: 'atm-f2 13s ease-in-out infinite'  },
  { top: '72%', left: '8%',  size: 48, anim: 'atm-f1 17s ease-in-out infinite'  },
  { top: '28%', left: '45%', size: 36, anim: 'atm-f2 19s ease-in-out infinite'  },
  { top: '84%', left: '66%', size: 60, anim: 'atm-f1 15s ease-in-out infinite'  },
  { top: '12%', left: '32%', size: 44, anim: 'atm-f2 21s ease-in-out infinite'  },
];
const FORMULAS = ['E=mc²', 'Σ', '∮', 'Ω', 'F=ma', 'λ', 'π', 'ΔV'];

function AtmosphereLayer() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `
        radial-gradient(1100px 700px at 70% 12%, rgba(56,130,246,0.28), transparent 60%),
        radial-gradient(900px 600px at 18% 80%, rgba(20,80,200,0.22), transparent 65%),
        linear-gradient(180deg, #03060f 0%, #050d1d 40%, #06101f 100%)
      ` }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `
        radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1px 1px at 78% 18%, rgba(180,210,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 33% 70%, rgba(255,255,255,0.55), transparent),
        radial-gradient(1px 1px at 88% 64%, rgba(160,200,255,0.45), transparent),
        radial-gradient(1px 1px at 55% 30%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1px 1px at 22% 88%, rgba(255,255,255,0.4), transparent)
      `, animation: 'atm-twinkle 6s ease-in-out infinite alternate' }} />
      {FORMULAS.map((f, i) => (
        <div key={i} style={{ position: 'absolute', top: FORMULA_ITEMS[i].top, left: FORMULA_ITEMS[i].left, fontSize: FORMULA_ITEMS[i].size, userSelect: 'none', color: 'rgba(160,200,255,0.07)', fontFamily: '"Space Grotesk","Plus Jakarta Sans",sans-serif', fontWeight: 700, animation: FORMULA_ITEMS[i].anim, textShadow: '0 0 30px rgba(80,150,255,0.15)' }}>{f}</div>
      ))}
      {[{ top: '18%', left: '28%', w: 6, dur: 12, d: 0 }, { top: '62%', left: '16%', w: 4, dur: 16, d: 3 }, { top: '78%', left: '58%', w: 7, dur: 18, d: 6 }, { top: '35%', left: '84%', w: 5, dur: 14, d: 9 }, { top: '48%', left: '50%', w: 3, dur: 11, d: 2 }].map((p, i) => (
        <div key={i} style={{ position: 'absolute', borderRadius: '50%', width: p.w, height: p.w, top: p.top, left: p.left, background: 'radial-gradient(circle,#a8d0ff 0%,rgba(168,208,255,0) 70%)', filter: 'blur(1px)', opacity: 0.55, animation: `atm-rise ${p.dur}s linear infinite ${p.d ? `-${p.d}s` : ''}` }} />
      ))}
    </div>
  );
}

// ── SubjectSectionBanner ─────────────────────────────────────
function SubjectSectionBanner({ topic, topicIdx, done, total, topicState }: { topic: GameTopic; topicIdx: number; done: number; total: number; topicState: TopicState }) {
  const isGold = topicState === 'completed';
  const pct    = Math.round((done / total) * 100);
  const bg     = isGold ? 'linear-gradient(118deg, #c98a00, #f5b800)' : `linear-gradient(118deg, ${topic.color}dd, ${topic.color})`;
  const glow   = isGold ? '0 12px 44px rgba(245,184,0,.45), 0 2px 10px rgba(0,0,0,.3)' : `0 12px 44px ${topic.color}44, 0 2px 10px rgba(0,0,0,.3)`;

  return (
    <div style={{ width: '100%', borderRadius: 22, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: bg, boxShadow: glow, border: '1px solid rgba(255,255,255,.18)', marginBottom: 32 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', marginBottom: 4 }}>
          Сэдэв {topicIdx + 1} · Давталт 1
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>{topic.name}</div>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.22)', overflow: 'hidden', maxWidth: 180 }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'rgba(255,255,255,.7)', transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 700, marginTop: 4 }}>{done}/{total}</div>
      </div>
      <button style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', whiteSpace: 'nowrap', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', flexShrink: 0, background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.42)', borderRadius: 14, padding: '10px 18px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Ic n="lesson" size={14} color="#fff" />
        ГАРЫН АВЛАГА
      </button>
    </div>
  );
}

// ── NodeConnector ─────────────────────────────────────────────
function NodeConnector({ prevDone, topicColor, topicState }: { prevDone: boolean; topicColor: string; topicState: TopicState }) {
  const isGold = topicState === 'completed';
  const stripe = prevDone ? (isGold ? 'repeating-linear-gradient(to bottom,#f5b800 0 6px,transparent 6px 12px)' : `repeating-linear-gradient(to bottom,${topicColor} 0 6px,transparent 6px 12px)`) : 'repeating-linear-gradient(to bottom,rgba(255,255,255,0.18) 0 6px,transparent 6px 12px)';
  const glow   = prevDone ? (isGold ? '0 0 12px rgba(245,184,0,.5)' : `0 0 12px ${topicColor}88`) : 'none';
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: 30 }}>
      <div style={{ width: 4, height: 30, borderRadius: 99, background: stripe, boxShadow: glow }} />
    </div>
  );
}

// ── LessonNode ────────────────────────────────────────────────
function LessonNode({ index, type, nodeStatus, starCount, topicColor, topicState, xpReward, onClick }: {
  index: number; type: LessonType; nodeStatus: 'done' | 'current' | 'locked';
  starCount: number; topicColor: string; topicState: TopicState; xpReward: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const isGold    = topicState === 'completed';
  const activeClr = TYPE_COLOR[type] ?? topicColor;
  const isBig     = nodeStatus === 'current' || (type === 'boss' && nodeStatus !== 'locked');
  const size      = isBig ? 88 : 72;
  const badge     = TYPE_BADGE[type];
  const label     = TYPE_LABEL[type];

  let circleBg = '', circleBorder = '', circleShadow = '';
  if (nodeStatus === 'done') {
    const c = isGold && type === 'lesson' ? '#f5b800' : activeClr;
    circleBg = `linear-gradient(148deg, ${c}, ${c}cc)`; circleBorder = `3px solid ${c}88`;
    circleShadow = `0 10px 30px ${c}66, 0 2px 10px rgba(0,0,0,.3), inset 0 2px 0 rgba(255,255,255,.22)`;
  } else if (nodeStatus === 'current') {
    circleBg = `linear-gradient(148deg, ${topicColor}, ${topicColor}cc)`;
    circleBorder = '4px solid rgba(255,255,255,0.7)';
    circleShadow = `0 12px 36px ${topicColor}99, 0 2px 10px rgba(0,0,0,.3), inset 0 2px 0 rgba(255,255,255,.3)`;
  } else {
    circleBg = 'linear-gradient(148deg,#1a2438,#101725)'; circleBorder = '3px solid rgba(255,255,255,0.06)'; circleShadow = 'none';
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label && badge && (
        <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 900, letterSpacing: '0.10em', padding: '3px 10px', borderRadius: 99, background: badge.bg, color: badge.color, whiteSpace: 'nowrap', zIndex: 3, opacity: nodeStatus === 'locked' ? 0.5 : 1 }}>{label}</div>
      )}
      {nodeStatus === 'current' && (
        <div style={{ position: 'absolute', top: -44, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#0b1424', fontSize: 11, fontWeight: 900, padding: '8px 16px', borderRadius: 14, letterSpacing: '0.08em', boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 6, whiteSpace: 'nowrap' }}>
          ЭХЛЭХ
          <div style={{ position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #fff' }} />
        </div>
      )}
      {nodeStatus === 'current' && (
        <>
          <div style={{ position: 'absolute', width: size + 24, height: size + 24, top: -12, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', border: `3px solid ${topicColor}`, opacity: 0.55, animation: 'cp-pulse 2.2s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: size + 48, height: size + 48, top: -24, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', border: `2px solid ${topicColor}`, opacity: 0.35, animation: 'cp-pulse 2.2s ease-in-out infinite 0.5s', pointerEvents: 'none' }} />
        </>
      )}
      <div onClick={nodeStatus !== 'locked' ? onClick : undefined}
        onMouseEnter={() => nodeStatus !== 'locked' && setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: nodeStatus === 'locked' ? 'default' : 'pointer', background: circleBg, border: circleBorder, boxShadow: circleShadow, transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1)', transform: hov && nodeStatus !== 'locked' ? 'scale(1.08) translateY(-3px)' : 'scale(1)' }}>
        {nodeStatus === 'done' && <svg width={size*0.43} height={size*0.43} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
        {nodeStatus === 'current' && <svg width={size*0.44} height={size*0.44} viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#fff" /></svg>}
        {nodeStatus === 'locked' && <svg width={size*0.37} height={size*0.37} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
      </div>
      {nodeStatus === 'done' && (
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {[0,1,2].map(i => <svg key={i} width={13} height={13} viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={i < starCount ? '#fcd34d' : 'transparent'} stroke={i < starCount ? '#f59e0b' : 'rgba(255,255,255,.22)'} strokeWidth="1.5" /></svg>)}
        </div>
      )}
      {hov && nodeStatus !== 'locked' && (
        <div style={{ position: 'absolute', bottom: size + (nodeStatus === 'done' ? 46 : 16), left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${activeClr}, ${activeClr}dd)`, borderRadius: 18, padding: '14px 20px', minWidth: 190, zIndex: 20, boxShadow: `0 12px 40px ${activeClr}66`, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `8px solid ${activeClr}` }} />
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{getLessonSequence()[index]?.title ?? `Давталт ${index + 1}`}</div>
          <div style={{ background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.5)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 900, fontSize: 15, color: '#fff' }}>
            ЭХЛЭХ · +{xpReward} XP
          </div>
        </div>
      )}
    </div>
  );
}

// ── SubjectSection ────────────────────────────────────────────
function SubjectSection({ topic, topicIdx, topicStars, currentNodeIdx, topicState, isActiveTopic, xpPerCorrect, topicChainLocked, onSelectLevel }: {
  topic: GameTopic; topicIdx: number; topicStars: number[]; currentNodeIdx: number;
  topicState: TopicState; isActiveTopic: boolean; xpPerCorrect: number; topicChainLocked: boolean;
  onSelectLevel: (level: number) => void;
}) {
  const done = topicStars.filter(s => s > 0).length;
  const seq = getLessonSequence();
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', pointerEvents: topicChainLocked ? 'none' : 'auto' }}>
      {topicChainLocked && (
        <div style={{ position: 'absolute', inset: -8, zIndex: 8, borderRadius: 20, background: 'rgba(3,8,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <div style={{ textAlign: 'center', padding: 16, color: '#e2e8f0', fontWeight: 800, fontSize: 13, maxWidth: 280 }}>
            🔒 Өмнөх сэдвийн бүх түвшинг амжилттай дуусгасны дараа нээгдэнэ
          </div>
        </div>
      )}
      <SubjectSectionBanner topic={topic} topicIdx={topicIdx} done={done} total={LEVELS_PER_TOPIC} topicState={topicState} />
      {Array.from({ length: LEVELS_PER_TOPIC }).map((_, i) => {
        const nodeSt     = topicStars[i] ?? 0;
        const isDone     = nodeSt > 0;
        const isCurr     = !topicChainLocked && i === currentNodeIdx;
        const isLock     = topicChainLocked || i > currentNodeIdx;
        const nodeStatus: 'done' | 'current' | 'locked' = isDone ? 'done' : isCurr ? 'current' : 'locked';
        const meta       = seq[i] ?? { type: 'lesson' as LessonType, xp: 10 };
        const offset     = NODE_OFFSETS[i] ?? 'center';
        const prevDone   = i > 0 && (topicStars[i-1] ?? 0) > 0;
        const xpReward   = meta.type === 'boss' ? xpPerCorrect * 10 : meta.type === 'quiz' ? xpPerCorrect * 7 : xpPerCorrect * 5;

        return (
          <React.Fragment key={i}>
            {i > 0 && <NodeConnector prevDone={prevDone} topicColor={topic.color} topicState={topicState} />}
            <div style={{ position: 'relative', width: '100%', display: 'flex', ...OFFSET_STYLES[offset] }}>
              {isCurr && isActiveTopic && nodeStatus === 'current' && (
                <div style={{ position: 'absolute', right: offset === 'off-r' || offset === 'off-r2' ? 'auto' : -150, left: offset === 'off-r' || offset === 'off-r2' ? -150 : 'auto', top: -24, zIndex: 4, pointerEvents: 'none', animation: 'cp-bob 4.2s ease-in-out infinite' }}>
                  <div style={{ position: 'absolute', inset: -20, background: `radial-gradient(circle,${topic.color}66 0%,transparent 65%)`, filter: 'blur(8px)', animation: 'cp-glow 3s ease-in-out infinite' }} />
                  <Image
                    src="/cyberphysic-logo.png"
                    alt=""
                    width={110}
                    height={110}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                    }}
                    style={{
                      width: 110,
                      height: 110,
                      objectFit: "contain",
                      display: "block",
                      clipPath: "inset(42% 0 0 52%)",
                      transform: "scale(2.1) translate(-10px, 10px)",
                      transformOrigin: "top right",
                      filter: `drop-shadow(0 8px 24px ${topic.color}88)`,
                    }}
                  />
                </div>
              )}
              <LessonNode index={i} type={meta.type} nodeStatus={nodeStatus} starCount={nodeSt} topicColor={topic.color} topicState={topicState} xpReward={xpReward} onClick={() => !isLock && onSelectLevel(i + 1)} />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SubjectDivider({ nextName }: { nextName?: string }) {
  return (
    <div style={{ margin: '48px 0', display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)' }} />
      {nextName && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', whiteSpace: 'nowrap' }}>↓ {nextName}</span>}
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)' }} />
    </div>
  );
}

interface Props {
  state: AppState;
  topicIdx: number;
  onTopicIdx: (i: number) => void;
  onSelectLevel: (topic: string, level: number) => void;
  /** Increment after server path sync so the map re-reads localStorage. */
  reloadSignal?: number;
}

export function GameMapPhase({ state, topicIdx: _topicIdx, onTopicIdx: _onTopicIdx, onSelectLevel, reloadSignal = 0 }: Props) {
  const [topics, setTopicsState] = useState<GameTopic[]>([]);
  const [stars, setStars]        = useState<Record<string, number[]>>({});
  const [settings]               = useState(getSettings());

  useEffect(() => {
    setTopicsState(getTopics());
    setStars(getStars());
  }, [reloadSignal]);

  if (!topics.length) return null;

  const activeTopicIdx = (() => {
    const idx = topics.findIndex(t => (stars[t.id] ?? []).filter(s => s > 0).length < LEVELS_PER_TOPIC);
    return idx < 0 ? topics.length - 1 : idx;
  })();

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative' }}>
      <AtmosphereLayer />

      {/* Stats bar */}
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0, padding: '10px 24px', background: 'rgba(5,10,22,0.6)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(120,180,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
        {[
          { icon: 'award', val: state.xp,                clr: '#c4b5fd', bg: 'rgba(139,92,246,.18)' },
          { icon: 'coin',  val: state.coins,             clr: '#fde68a', bg: 'rgba(245,184,0,.18)'  },
          { icon: 'flame', val: `${state.streak} өдөр`, clr: '#fca5a5', bg: 'rgba(239,68,68,.18)'  },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#9fb2cf', fontWeight: 600 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic n={s.icon} size={13} color={s.clr} />
            </div>
            <span style={{ fontWeight: 800, color: '#eaf2ff' }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Scrollable map */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 24px 100px' }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            {topics.map((topic, ti) => {
              const topicStars     = stars[topic.id] ?? [];
              const done           = topicStars.filter(s => s > 0).length;
              const currentNodeIdx = Math.min(done, LEVELS_PER_TOPIC - 1);
              const topicState     = getTopicState(topic.id, stars);
              const nextTopic      = topics[ti + 1];
              const prevTopicId    = ti > 0 ? topics[ti - 1]?.id : null;
              const topicChainLocked = ti > 0 && prevTopicId != null && !isTopicFullyDone(prevTopicId, stars);
              return (
                <React.Fragment key={topic.id}>
                  <SubjectSection topic={topic} topicIdx={ti} topicStars={topicStars} currentNodeIdx={currentNodeIdx} topicState={topicState} isActiveTopic={ti === activeTopicIdx} xpPerCorrect={settings.xpPerCorrect} topicChainLocked={topicChainLocked} onSelectLevel={level => onSelectLevel(topic.name, level)} />
                  {ti < topics.length - 1 && <SubjectDivider nextName={nextTopic?.name} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes atm-twinkle { from{opacity:.6} to{opacity:1} }
        @keyframes atm-f1 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-26px) rotate(2deg)} }
        @keyframes atm-f2 { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-18px) rotate(-3deg)} }
        @keyframes atm-rise { 0%{transform:translateY(0);opacity:0} 10%{opacity:.6} 90%{opacity:.5} 100%{transform:translateY(-700px);opacity:0} }
        @keyframes cp-pulse { 0%,100%{transform:translateX(-50%) scale(1);opacity:.55} 50%{transform:translateX(-50%) scale(1.15);opacity:.85} }
        @keyframes cp-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes cp-glow  { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
