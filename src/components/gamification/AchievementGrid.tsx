'use client';

export type AchievementRow = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export function AchievementGrid({ items }: { items: AchievementRow[] }) {
  return (
    <div className="cy-achievements">
      <div className="cy-achievements-title">🏆 Амжилтууд</div>
      <div className="cy-achievements-grid">
        {items.map((a) => (
          <div
            key={a.id}
            className={`cy-achievement${a.unlocked ? ' cy-achievement--unlocked' : ''}`}
            title={a.description}
          >
            <span className="cy-achievement-icon">{a.icon}</span>
            <span className="cy-achievement-name">{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
