'use client';
import React, { useEffect, useState } from 'react';
import { Ic } from '@/components/ui';
import {
  getTopicsV2, getStarsV2,
  type GameTopicWithSubtopics, type GameSubtopic,
} from '@/lib/game-data';
import type { AppState } from '@/types';

type OffsetType = 'center' | 'off-l' | 'off-l2' | 'off-r' | 'off-r2';
const NODE_OFFSETS: OffsetType[] = ['center','off-l','off-r','center','off-l2','off-r','center','off-l','off-r2','center'];
const OFFSET_STYLES: Record<OffsetType, React.CSSProperties> = {
  center: { justifyContent: 'center' },
  'off-l':  { justifyContent: 'flex-start', paddingLeft: 72 },
  'off-l2': { justifyContent: 'flex-start', paddingLeft: 24 },
  'off-r':  { justifyContent: 'flex-end',   paddingRight: 72 },
  'off-r2': { justifyContent: 'flex-end',   paddingRight: 24 },
};

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


interface Props {
  state: AppState;
  topicIdx: number;
  onTopicIdx: (i: number) => void;
  onSelectLevel: (topic: string, level: number | string) => void;
  onBackToDashboard?: () => void;
  /** Increment after server path sync so the map re-reads localStorage. */
  reloadSignal?: number;
}

function MapStatsBar({ state, onBackToDashboard }: { state: AppState; onBackToDashboard?: () => void }) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        flexShrink: 0,
        padding: '10px 20px',
        background: 'rgba(5,10,22,0.6)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(120,180,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      {onBackToDashboard ? (
        <button
          type="button"
          onClick={onBackToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.08)',
            color: '#eaf2ff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          <Ic n="chevLeft" size={16} color="#eaf2ff" />
          Нүүр хуудас
        </button>
      ) : (
        <div />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 'auto' }}>
        {[
          { icon: 'award', val: state.xp, clr: '#c4b5fd', bg: 'rgba(139,92,246,.18)' },
          { icon: 'coin', val: state.coins, clr: '#fde68a', bg: 'rgba(245,184,0,.18)' },
          { icon: 'flame', val: `${state.streak} өдөр`, clr: '#fca5a5', bg: 'rgba(239,68,68,.18)' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#9fb2cf', fontWeight: 600 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic n={s.icon} size={13} color={s.clr} />
            </div>
            <span style={{ fontWeight: 800, color: '#eaf2ff' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── V2: Single subtopic node ───────────────────────────────────
function SubtopicNode({ sub, index, topicColor, subtopicStars, prevDone, onSelect }: {
  sub: GameSubtopic;
  index: number;
  topicColor: string;
  subtopicStars: Record<string, number>;
  prevDone: boolean;
  onSelect: () => void;
}) {
  const [hov, setHov] = useState(false);
  const isDone = (subtopicStars[sub.id] ?? 0) > 0;
  const isCurr = !isDone && prevDone;
  const isLock = !isDone && !prevDone;
  const nodeStatus: 'done' | 'current' | 'locked' = isDone ? 'done' : isCurr ? 'current' : 'locked';
  const offset = NODE_OFFSETS[index % NODE_OFFSETS.length] ?? 'center';
  const starCount = subtopicStars[sub.id] ?? 0;
  const size = nodeStatus === 'current' ? 88 : 72;

  let circleBg = '', circleBorder = '', circleShadow = '';
  if (nodeStatus === 'done') {
    circleBg = `linear-gradient(148deg, ${topicColor}, ${topicColor}cc)`;
    circleBorder = `3px solid ${topicColor}88`;
    circleShadow = `0 10px 30px ${topicColor}66, 0 2px 10px rgba(0,0,0,.3), inset 0 2px 0 rgba(255,255,255,.22)`;
  } else if (nodeStatus === 'current') {
    circleBg = `linear-gradient(148deg, ${topicColor}, ${topicColor}cc)`;
    circleBorder = '4px solid rgba(255,255,255,0.7)';
    circleShadow = `0 12px 36px ${topicColor}99, 0 2px 10px rgba(0,0,0,.3), inset 0 2px 0 rgba(255,255,255,.3)`;
  } else {
    circleBg = 'linear-gradient(148deg,#1a2438,#101725)';
    circleBorder = '3px solid rgba(255,255,255,0.06)';
    circleShadow = 'none';
  }

  const activate = () => { if (!isLock) onSelect(); };

  return (
    <>
      {index > 0 && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: 30 }}>
          <div style={{ width: 4, height: 30, borderRadius: 99, background: prevDone ? `repeating-linear-gradient(to bottom,${topicColor} 0 6px,transparent 6px 12px)` : 'repeating-linear-gradient(to bottom,rgba(255,255,255,0.18) 0 6px,transparent 6px 12px)', boxShadow: prevDone ? `0 0 12px ${topicColor}88` : 'none' }} />
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', display: 'flex', ...OFFSET_STYLES[offset] }}>
        <div
          role="button"
          tabIndex={isLock ? -1 : 0}
          aria-disabled={isLock}
          onClick={activate}
          onKeyDown={e => { if (!isLock && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); activate(); } }}
          onMouseEnter={() => !isLock && setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: nodeStatus === 'current' ? 52 : 0, cursor: isLock ? 'default' : 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          {nodeStatus === 'current' && (
            <>
              <div style={{ position: 'absolute', width: size + 24, height: size + 24, top: 40, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', border: `3px solid ${topicColor}`, opacity: 0.55, animation: 'cp-pulse 2.2s ease-in-out infinite', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', width: size + 48, height: size + 48, top: 28, left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', border: `2px solid ${topicColor}`, opacity: 0.35, animation: 'cp-pulse 2.2s ease-in-out infinite 0.5s', pointerEvents: 'none' }} />
            </>
          )}
          {nodeStatus === 'current' && (
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#0b1424', fontSize: 11, fontWeight: 900, padding: '8px 16px', borderRadius: 14, letterSpacing: '0.08em', boxShadow: '0 8px 24px rgba(0,0,0,.4)', zIndex: 6, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              ЭХЛЭХ
              <div style={{ position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #fff' }} />
            </div>
          )}
          <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: circleBg, border: circleBorder, boxShadow: circleShadow, transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1)', transform: hov && !isLock ? 'scale(1.08) translateY(-3px)' : 'scale(1)' }}>
            {nodeStatus === 'done' && <svg width={size*0.43} height={size*0.43} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            {nodeStatus === 'current' && <svg width={size*0.44} height={size*0.44} viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#fff" /></svg>}
            {nodeStatus === 'locked' && <svg width={size*0.37} height={size*0.37} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
          </div>
          {nodeStatus === 'done' && (
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {[0,1,2].map(si => <svg key={si} width={13} height={13} viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={si < starCount ? '#fcd34d' : 'transparent'} stroke={si < starCount ? '#f59e0b' : 'rgba(255,255,255,.22)'} strokeWidth="1.5" /></svg>)}
            </div>
          )}
          {hov && !isLock && (
            <div style={{ position: 'absolute', bottom: size + (nodeStatus === 'done' ? 46 : 16), left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${topicColor}, ${topicColor}dd)`, borderRadius: 18, padding: '14px 20px', minWidth: 190, zIndex: 20, boxShadow: `0 12px 40px ${topicColor}66`, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `8px solid ${topicColor}` }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{sub.name}</div>
              {sub.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{sub.description}</div>}
              <div style={{ background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.5)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 900, fontSize: 15, color: '#fff' }}>
                ЭХЛЭХ
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── V2: Subtopic-based section ─────────────────────────────────
function SubtopicSection({ topic, subtopicStars, onSelectSubtopic }: {
  topic: GameTopicWithSubtopics;
  subtopicStars: Record<string, number>;
  onSelectSubtopic: (subtopicId: string) => void;
}) {
  const done = topic.subtopics.filter(s => (subtopicStars[s.id] ?? 0) > 0).length;
  const total = topic.subtopics.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bg = `linear-gradient(118deg, ${topic.color}dd, ${topic.color})`;
  const glow = `0 12px 44px ${topic.color}44, 0 2px 10px rgba(0,0,0,.3)`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {/* Banner */}
      <div style={{ width: '100%', borderRadius: 22, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: bg, boxShadow: glow, border: '1px solid rgba(255,255,255,.18)', marginBottom: 32 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', marginBottom: 4 }}>
            {topic.icon} Сэдэв
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>{topic.name}</div>
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.22)', overflow: 'hidden', maxWidth: 180 }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'rgba(255,255,255,.7)', transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 700, marginTop: 4 }}>{done}/{total}</div>
        </div>
      </div>

      {/* Subtopic nodes */}
      {topic.subtopics.map((sub, i) => {
        const prevDone = i === 0 || (subtopicStars[topic.subtopics[i - 1]?.id ?? ''] ?? 0) > 0;
        return (
          <SubtopicNode
            key={sub.id}
            sub={sub}
            index={i}
            topicColor={topic.color}
            subtopicStars={subtopicStars}
            prevDone={prevDone}
            onSelect={() => onSelectSubtopic(sub.id)}
          />
        );
      })}
    </div>
  );
}

export function GameMapPhase({ state, topicIdx: _topicIdx, onTopicIdx: _onTopicIdx, onSelectLevel, onBackToDashboard, reloadSignal = 0 }: Props) {
  const [topicsV2, setTopicsV2State] = useState<GameTopicWithSubtopics[]>([]);
  const [starsV2, setStarsV2State]   = useState<Record<string, number>>({});
  const [loaded, setLoaded]          = useState(false);

  useEffect(() => {
    setTopicsV2State(getTopicsV2());
    setStarsV2State(getStarsV2());
    setLoaded(true);
  }, [reloadSignal]);

  const mapStyles = `
    @keyframes atm-twinkle { from{opacity:.6} to{opacity:1} }
    @keyframes atm-f1 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-26px) rotate(2deg)} }
    @keyframes atm-f2 { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-18px) rotate(-3deg)} }
    @keyframes atm-rise { 0%{transform:translateY(0);opacity:0} 10%{opacity:.6} 90%{opacity:.5} 100%{transform:translateY(-700px);opacity:0} }
    @keyframes cp-pulse { 0%,100%{transform:translateX(-50%) scale(1);opacity:.55} 50%{transform:translateX(-50%) scale(1.15);opacity:.85} }
    @keyframes cp-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes cp-glow  { 0%,100%{opacity:.6} 50%{opacity:1} }
  `;

  if (loaded && topicsV2.length === 0) {
    return (
      <div style={{ width: '100%', maxWidth: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative' }}>
        <AtmosphereLayer />
        <MapStatsBar state={state} onBackToDashboard={onBackToDashboard} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 400, textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.9 }}>Φ</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>Хичээл байхгүй байна</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
              Админ самбарт «Тоглоомын курс» хэсгээс сэдэв, хичээл, асуулт нэмсний дараа энд харагдана.
            </p>
          </div>
        </div>
        <style>{mapStyles}</style>
      </div>
    );
  }

  if (topicsV2.length > 0) {
    return (
      <div style={{ width: '100%', maxWidth: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative' }}>
        <AtmosphereLayer />
        <MapStatsBar state={state} onBackToDashboard={onBackToDashboard} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2 }}>
          <div className="game-map-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 24px 100px' }}>
            <div style={{ width: '100%', maxWidth: 480 }}>
              {topicsV2.map((topic, ti) => (
                <React.Fragment key={topic.id}>
                  <SubtopicSection
                    topic={topic}
                    subtopicStars={starsV2}
                    onSelectSubtopic={subtopicId => onSelectLevel(topic.name, subtopicId)}
                  />
                  {ti < topicsV2.length - 1 && (
                    <div style={{ margin: '48px 0', display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)' }} />
                      <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', whiteSpace: 'nowrap' }}>↓ {topicsV2[ti + 1]?.name}</span>
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)' }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
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

  return (
    <div style={{ width: '100%', maxWidth: '100vw', height: '100vh', background: '#0a0f1a' }}>
      <MapStatsBar state={state} onBackToDashboard={onBackToDashboard} />
    </div>
  );
}
