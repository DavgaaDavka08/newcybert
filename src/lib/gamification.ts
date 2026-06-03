/**
 * CyberPhysics economy — single source of truth.
 * Design doc: docs/GAME_ECONOMY.md
 */

export const MAX_LIVES = 5;
export const LIFE_REFILL_MS = 30 * 60 * 1000;
export const MAP_PASS_RATIO = 0.6;

/** Cumulative total XP required to reach each level (1–50) */
function buildLevelXpThresholds(): number[] {
  const early = [100, 150, 250, 300, 400, 500, 700, 600, 1000];
  const thresholds = [0];
  let total = 0;
  for (let L = 2; L <= 50; L++) {
    let delta: number;
    if (L <= 10) delta = early[L - 2] ?? 1000;
    else if (L <= 20) delta = 800 + (L - 10) * 80;
    else if (L <= 30) delta = 1500 + (L - 20) * 120;
    else if (L <= 40) delta = 2700 + (L - 30) * 180;
    else delta = 4500 + (L - 40) * 250;
    total += delta;
    thresholds.push(total);
  }
  return thresholds;
}

export const LEVEL_XP_THRESHOLDS = buildLevelXpThresholds() as readonly number[];
export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

export function xpNeededForLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  const cur = LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_XP_THRESHOLDS[level] ?? LEVEL_XP_THRESHOLDS[MAX_LEVEL - 1];
  return next - cur;
}

// ── Lesson / map subtopic ────────────────────────────────────
export const SUBTOPIC_XP_START = 3;
export const SUBTOPIC_XP_COMPLETE = 5;
export const SUBTOPIC_XP_PERFECT = 5;
export const SUBTOPIC_XP_MAX =
  SUBTOPIC_XP_START + SUBTOPIC_XP_COMPLETE + SUBTOPIC_XP_PERFECT;
export const TOPIC_XP_BONUS = 15;
export const SUBTOPIC_COIN_COMPLETE = 1;
export const CATEGORY_COIN_COMPLETE = 3;

// ── Video ────────────────────────────────────────────────────
export const VIDEO_XP_HALF = 2;
export const VIDEO_XP_FULL = 3;
export const VIDEO_XP_QUIZ = 8;

// ── Exam ─────────────────────────────────────────────────────
export function calcExamXp(percent: number): number {
  let xp = 2;
  if (percent >= 80) xp += 5;
  else if (percent >= 50) xp += 3;
  return xp;
}

export function calcExamCoins(percent: number): number {
  if (percent >= 100) return 2;
  if (percent >= 80) return 1;
  return 0;
}

// ── EES ──────────────────────────────────────────────────────
export function calcEesXp(percent: number): number {
  let xp = 5;
  if (percent >= 95) xp += 25;
  else if (percent >= 80) xp += 15;
  else if (percent >= 50) xp += 5;
  return xp;
}

export function calcEesCoins(percent: number): number {
  if (percent >= 100) return 5;
  if (percent >= 95) return 3;
  if (percent >= 80) return 2;
  return 0;
}

// ── Coin costs ───────────────────────────────────────────────
export const COIN_COSTS = {
  exam_start: 0,
  exam_retake: 3,
  ees_retake: 5,
  video_watch: 5,
  pdf_download: 10,
  ai_explanation: 4,
  solution_steps: 1,
  correct_answer: 1,
  hint: 1,
  full_heal: 8,
} as const;

export type CoinSpendAction = keyof typeof COIN_COSTS;

export const COIN_VIDEO_UNLOCK = COIN_COSTS.video_watch;

// ── Streak coins (daily check-in uses milestone table) ───────
export const STREAK_COIN_REWARDS: { days: number; coins: number; badge?: string }[] = [
  { days: 1, coins: 1 },
  { days: 3, coins: 3 },
  { days: 7, coins: 10, badge: 'streak_7' },
  { days: 30, coins: 50, badge: 'streak_30' },
];

export function getStreakCoinReward(streak: number): number {
  const hit = [...STREAK_COIN_REWARDS].reverse().find((r) => streak >= r.days);
  return hit?.coins ?? 1;
}

// ── Level math ───────────────────────────────────────────────
export function calcLevel(xp: number): number {
  const total = Math.max(0, xp);
  let level = 1;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (total >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, MAX_LEVEL);
}

export function getXpProgress(xp: number) {
  const total = Math.max(0, xp);
  const level = calcLevel(total);
  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1] ?? 0;
  const atMax = level >= MAX_LEVEL;
  const nextThreshold = atMax
    ? LEVEL_XP_THRESHOLDS[MAX_LEVEL - 1]
    : (LEVEL_XP_THRESHOLDS[level] ?? LEVEL_XP_THRESHOLDS[MAX_LEVEL - 1]);
  const xpInLevel = total - currentThreshold;
  const xpToNext = atMax ? 0 : nextThreshold - currentThreshold;
  const remaining = atMax ? 0 : Math.max(0, nextThreshold - total);
  const pct = atMax ? 100 : xpToNext > 0 ? Math.round((xpInLevel / xpToNext) * 100) : 100;
  return {
    level,
    xpInLevel,
    xpToNext,
    remaining,
    pct,
    nextLevel: atMax ? MAX_LEVEL : level + 1,
    totalXp: total,
    currentThreshold,
    nextThreshold,
  };
}

export function calcSubtopicCompleteXp(perfect: boolean): number {
  return SUBTOPIC_XP_COMPLETE + (perfect ? SUBTOPIC_XP_PERFECT : 0);
}

export type LevelReward = {
  level: number;
  label: string;
  coins?: number;
  badge?: string;
  perk?: string;
};

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 2, label: '+2 зоос', coins: 2 },
  { level: 5, label: 'Badge: Анхны алхам', badge: 'first_steps' },
  { level: 10, label: '+5 зоос', coins: 5 },
  { level: 15, label: 'Badge: Physics Rising', badge: 'physics_rising' },
  { level: 20, label: '+8 зоос', coins: 8 },
  { level: 25, label: 'Badge: Dedicated', badge: 'dedicated_learner' },
  { level: 30, label: '+10 зоос', coins: 10 },
  { level: 40, label: 'Badge: Physics Master', badge: 'physics_master' },
  { level: 50, label: 'Cyber Legend +25 зоос', badge: 'cyber_legend', coins: 25 },
];

export function getNextLevelReward(level: number): LevelReward | undefined {
  return LEVEL_REWARDS.find((r) => r.level > level);
}

// ── Topic badges (branches) ──────────────────────────────────
export const PHYSICS_BRANCHES = [
  'mechanics',
  'electricity',
  'heat',
  'optics',
  'waves',
  'modern',
] as const;

export type PhysicsBranch = (typeof PHYSICS_BRANCHES)[number];
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export function branchBadgeId(branch: PhysicsBranch, tier: BadgeTier): string {
  return `${branch}_${tier}`;
}

// ── Daily / weekly / monthly ───────────────────────────────────
export type DailyQuestId = 'video' | 'exam' | 'lesson' | 'all_bonus';

export const DAILY_QUESTS: {
  id: DailyQuestId;
  label: string;
  xp: number;
  target?: number;
}[] = [
  { id: 'video', label: '1 видео үз (50%+)', xp: 3 },
  { id: 'exam', label: '1 шалгалт өг', xp: 3 },
  { id: 'lesson', label: '1 сэдэв дуусгах', xp: 5, target: 1 },
  { id: 'all_bonus', label: 'Бүгдийг хийвэл', xp: 0 },
];

export const DAILY_ALL_BONUS_COINS = 2;

/** Шинэ хэрэглэгчийн эхлэл зоос (хуучин 100 биш — GAME_ECONOMY.md) */
export const STARTER_COINS = 10;

/** DB-д хуучин login bonus засах migration */
export const ECONOMY_VERSION = 2;

export const WEEKLY_QUESTS = [
  { id: 'lessons_5', label: '5 сэдэв дуусгах', xp: 20, coins: 5, target: 5 },
  { id: 'exams_2', label: '2 шалгалт', xp: 15, coins: 0, target: 2 },
] as const;

export const MONTHLY_QUESTS = [
  { id: 'lessons_20', label: '20 сэдэв (сар)', xp: 50, coins: 10, target: 20 },
  { id: 'streak_20', label: '20 өдрийн streak', xp: 30, coins: 15, target: 20 },
] as const;

export type AchievementDef = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_exam', icon: '🏆', title: 'Анхны шалгалт', description: 'Эхний шалгалтаа дуусгасан' },
  { id: 'streak_7', icon: '🔥', title: '7 хоног дараалан', description: '7 өдрийн streak' },
  { id: 'questions_100', icon: '📐', title: '100 асуулт', description: '100 бодлого' },
  { id: 'xp_1000', icon: '⭐', title: '1000 XP', description: '1000 XP' },
  { id: 'electric_gold', icon: '⚡', title: 'Цахилгаан — Gold', description: 'Цахилгаан бүрэн' },
];

export function getSubtopicRewards(_index?: number) {
  return {
    xp: SUBTOPIC_XP_MAX,
    coins: SUBTOPIC_COIN_COMPLETE,
    badge: undefined as string | undefined,
  };
}

/** Active learner (~30 min/day) */
export const ECONOMY_ESTIMATES = {
  xpPerDayActive: 35,
  coinsPerMonthActive: 55,
  coinsSpendPerMonthActive: 74,
  daysToLevel: (level: number, xpPerDay = 35) => {
    const target = LEVEL_XP_THRESHOLDS[Math.min(level, MAX_LEVEL) - 1] ?? 0;
    return Math.ceil(target / xpPerDay);
  },
} as const;

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekKey(d = new Date()) {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setUTCDate(diff);
  return monday.toISOString().slice(0, 10);
}

export function applyLivesRefill(
  lives: number,
  maxLives: number,
  livesUpdatedAt: Date | null | undefined,
  now = Date.now(),
): { lives: number; livesUpdatedAt: Date | null; nextRefillAt: number | null } {
  if (lives >= maxLives) {
    return { lives: maxLives, livesUpdatedAt: null, nextRefillAt: null };
  }
  if (!livesUpdatedAt) {
    return { lives, livesUpdatedAt: null, nextRefillAt: now + LIFE_REFILL_MS };
  }
  const elapsed = now - new Date(livesUpdatedAt).getTime();
  const gained = Math.floor(elapsed / LIFE_REFILL_MS);
  if (gained <= 0) {
    const nextRefillAt = new Date(livesUpdatedAt).getTime() + LIFE_REFILL_MS;
    return { lives, livesUpdatedAt, nextRefillAt };
  }
  const newLives = Math.min(maxLives, lives + gained);
  if (newLives >= maxLives) {
    return { lives: maxLives, livesUpdatedAt: null, nextRefillAt: null };
  }
  const remainder = elapsed % LIFE_REFILL_MS;
  const updatedAt = new Date(now - remainder);
  return {
    lives: newLives,
    livesUpdatedAt: updatedAt,
    nextRefillAt: updatedAt.getTime() + LIFE_REFILL_MS,
  };
}
