'use client';

import { T } from '@/styles/tokens';

export type QuestRow = {
  id: string;
  label: string;
  xp: number;
  done: boolean;
  current?: number;
  target?: number;
};

type DailyQuestsCardProps = {
  quests: QuestRow[];
  allBonus: { coins: number; done: boolean; claimed: boolean };
};

export function DailyQuestsCard({ quests, allBonus }: DailyQuestsCardProps) {
  return (
    <div className="cy-quests-card">
      <div className="cy-quests-title">🎯 Өнөөдрийн даалгавар</div>
      <ul className="cy-quests-list">
        {quests.map((q) => (
          <li key={q.id} className={`cy-quest-item${q.done ? ' cy-quest-item--done' : ''}`}>
            <span className="cy-quest-check">{q.done ? '☑' : '□'}</span>
            <span className="cy-quest-label">
              {q.label}
              {q.id === 'questions' && q.target
                ? ` (${q.current ?? 0}/${q.target})`
                : ''}
            </span>
            <span className="cy-quest-xp">+{q.xp} XP</span>
          </li>
        ))}
      </ul>
      <div className={`cy-quests-bonus${allBonus.done ? ' cy-quests-bonus--ready' : ''}`}>
        <span>Бүгдийг хийвэл:</span>
        <strong>+{allBonus.coins} coin</strong>
        {allBonus.claimed && (
          <span style={{ color: T.green, fontSize: 11, marginLeft: 6 }}>✓ авсан</span>
        )}
      </div>
    </div>
  );
}
