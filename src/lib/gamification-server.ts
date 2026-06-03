import {
  calcLevel,
  todayKey,
  weekKey,
  applyLivesRefill,
  LEVEL_REWARDS,
  DAILY_ALL_BONUS_COINS,
  ACHIEVEMENTS,
  LIFE_REFILL_MS,
  type AchievementDef,
} from '@/lib/gamification';

type UserDoc = {
  xp?: number;
  level?: number;
  coins?: number;
  lives?: number;
  maxLives?: number;
  livesUpdatedAt?: Date | null;
  streak?: number;
  dailyXp?: number;
  weeklyXp?: number;
  dailyXpDate?: string;
  weeklyXpDate?: string;
  xpHistory?: { amount: number; reason: string; createdAt?: Date }[];
  achievements?: { id: string; unlockedAt?: Date }[];
  claimedLevelRewards?: number[];
  dailyQuests?: {
    date?: string;
    video?: boolean;
    exam?: boolean;
    questions?: number;
    allClaimed?: boolean;
  };
  statsCounters?: {
    examsTaken?: number;
    questionsAnswered?: number;
    videosWatched?: number;
    topicsCompleted?: number;
  };
  isPremium?: boolean;
  premiumUntil?: Date;
};

export function resetXpPeriods(user: UserDoc, xpDelta: number) {
  const today = todayKey();
  const week = weekKey();
  if (user.dailyXpDate !== today) {
    user.dailyXp = 0;
    user.dailyXpDate = today;
  }
  if (user.weeklyXpDate !== week) {
    user.weeklyXp = 0;
    user.weeklyXpDate = week;
  }
  if (xpDelta > 0) {
    user.dailyXp = (user.dailyXp ?? 0) + xpDelta;
    user.weeklyXp = (user.weeklyXp ?? 0) + xpDelta;
  }
}

export function pushXpHistory(user: UserDoc, amount: number, reason: string) {
  if (!amount) return;
  const entry = { amount, reason: reason || 'XP', createdAt: new Date() };
  user.xpHistory = [entry, ...(user.xpHistory ?? [])].slice(0, 20);
}

export function ensureDailyQuests(user: UserDoc): void {
  const today = todayKey();
  if (user.dailyQuests?.date !== today) {
    user.dailyQuests = { date: today, video: false, exam: false, questions: 0, allClaimed: false };
  }
}

export function trackDailyQuest(user: UserDoc, kind: 'video' | 'exam' | 'question' | 'lesson') {
  ensureDailyQuests(user);
  const q = user.dailyQuests!;
  if (kind === 'video') q.video = true;
  if (kind === 'exam') q.exam = true;
  if (kind === 'question' || kind === 'lesson') {
    q.questions = Math.min(1, (q.questions ?? 0) + 1);
  }
}

export function tryClaimDailyAllBonus(user: UserDoc): number {
  ensureDailyQuests(user);
  const q = user.dailyQuests!;
  if (q.allClaimed) return 0;
  if (!q.video || !q.exam || (q.questions ?? 0) < 1) return 0;
  q.allClaimed = true;
  user.coins = (user.coins ?? 0) + DAILY_ALL_BONUS_COINS;
  return DAILY_ALL_BONUS_COINS;
}

export function unlockAchievement(user: UserDoc, id: string): boolean {
  const list = user.achievements ?? [];
  if (list.some((a) => a.id === id)) return false;
  user.achievements = [...list, { id, unlockedAt: new Date() }];
  return true;
}

export function evaluateAchievements(user: UserDoc): string[] {
  const unlocked: string[] = [];
  const c = user.statsCounters ?? {};
  const xp = user.xp ?? 0;
  const streak = user.streak ?? 0;

  if ((c.examsTaken ?? 0) >= 1 && unlockAchievement(user, 'first_exam')) unlocked.push('first_exam');
  if (streak >= 7 && unlockAchievement(user, 'streak_7')) unlocked.push('streak_7');
  if ((c.questionsAnswered ?? 0) >= 100 && unlockAchievement(user, 'questions_100')) unlocked.push('questions_100');
  if (xp >= 1000 && unlockAchievement(user, 'xp_1000')) unlocked.push('xp_1000');

  return unlocked;
}

export function applyLevelRewards(user: UserDoc, oldLevel: number, newLevel: number): string[] {
  const messages: string[] = [];
  const claimed = new Set(user.claimedLevelRewards ?? []);

  for (const reward of LEVEL_REWARDS) {
    if (reward.level <= oldLevel || reward.level > newLevel) continue;
    if (claimed.has(reward.level)) continue;
    claimed.add(reward.level);
    if (reward.coins) {
      user.coins = (user.coins ?? 0) + reward.coins;
      messages.push(`Level ${reward.level}: +${reward.coins} зоос`);
    }
    if (reward.badge) {
      unlockAchievement(user, reward.badge);
      messages.push(`Level ${reward.level}: ${reward.label}`);
    }
    if (reward.perk) {
      messages.push(`Level ${reward.level}: ${reward.label}`);
    }
  }

  user.claimedLevelRewards = [...claimed];
  return messages;
}

export function syncLives(user: UserDoc) {
  const max = user.maxLives ?? 5;
  const result = applyLivesRefill(user.lives ?? max, max, user.livesUpdatedAt ?? null);
  user.lives = result.lives;
  user.livesUpdatedAt = result.livesUpdatedAt ?? undefined;
  return result.nextRefillAt;
}

export function loseLife(user: UserDoc): { lives: number; nextRefillAt: number | null } {
  const max = user.maxLives ?? 5;
  let lives = Math.max(0, (user.lives ?? max) - 1);
  user.lives = lives;
  if (lives < max && !user.livesUpdatedAt) {
    user.livesUpdatedAt = new Date();
  }
  const nextRefillAt =
    lives < max && user.livesUpdatedAt
      ? new Date(user.livesUpdatedAt).getTime() + LIFE_REFILL_MS
      : null;
  return { lives, nextRefillAt };
}

export function formatAchievements(user: UserDoc) {
  const unlockedIds = new Set((user.achievements ?? []).map((a) => a.id));
  return ACHIEVEMENTS.map((a: AchievementDef) => ({
    ...a,
    unlocked: unlockedIds.has(a.id),
    unlockedAt: user.achievements?.find((x) => x.id === a.id)?.unlockedAt,
  }));
}

/** DB/session-д хуучин level (жишээ xp=180, level=1) засах */
export function ensureLevelSynced(user: UserDoc): number {
  const correct = calcLevel(user.xp ?? 0);
  if (user.level !== correct) {
    user.level = correct;
  }
  return correct;
}

export { calcLevel };
