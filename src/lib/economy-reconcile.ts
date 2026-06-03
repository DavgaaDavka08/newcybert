import {
  STARTER_COINS,
  SUBTOPIC_COIN_COMPLETE,
  CATEGORY_COIN_COMPLETE,
  LEVEL_REWARDS,
  calcLevel,
} from '@/lib/gamification';

type UserLike = {
  xp?: number;
  coins?: number;
  streak?: number;
  gameCompletedSubtopics?: string[];
  gameCompletedTopics?: string[];
  statsCounters?: {
    examsTaken?: number;
    videosWatched?: number;
  };
  xpHistory?: { amount: number }[];
};

/** DB дээрх явдалд үндэслэн олж болох зоосын доод хязгаар */
export function estimateEarnedCoins(user: UserLike): number {
  let total = STARTER_COINS;
  total += (user.gameCompletedSubtopics?.length ?? 0) * SUBTOPIC_COIN_COMPLETE;
  total += (user.gameCompletedTopics?.length ?? 0) * CATEGORY_COIN_COMPLETE;

  const level = calcLevel(user.xp ?? 0);
  for (const r of LEVEL_REWARDS) {
    if (r.coins && level >= r.level) total += r.coins;
  }

  const streak = user.streak ?? 0;
  if (streak >= 30) total += 50;
  else if (streak >= 7) total += 10;
  else if (streak >= 3) total += 3;
  else if (streak >= 1) total += 1;

  total += Math.min((user.statsCounters?.examsTaken ?? 0) * 2, 40);
  return total;
}

/** XP түүхийн нийлбэртэй зөрүүг засах (хэрэв түүх бүрэн бол) */
export function reconcileXpFromHistory(user: UserLike): number | null {
  const history = user.xpHistory ?? [];
  if (history.length < 2) return null;
  const sum = history.reduce((a, h) => a + (h.amount ?? 0), 0);
  const current = user.xp ?? 0;
  if (sum > 0 && sum < current && current - sum > 50) return sum;
  return null;
}

/**
 * Хуучин login (+20/өдөр), welcome 100 зэрэг inflate-ийг бууруулна.
 * Зарцуулалт түүхгүй тул зөвхөн дээш inflate-ийг clamp хийнэ.
 */
export function reconcileInflatedBalance(user: UserLike & { coins?: number; xp?: number }): {
  coinsAdjusted: boolean;
  xpAdjusted: boolean;
  newCoins: number;
  newXp: number;
} {
  const earned = estimateEarnedCoins(user);
  const buffer = 25;
  let coins = user.coins ?? 0;
  let xp = user.xp ?? 0;
  let coinsAdjusted = false;
  let xpAdjusted = false;

  if (coins > earned + buffer) {
    coins = Math.max(earned, STARTER_COINS);
    coinsAdjusted = true;
  }

  const xpFromHistory = reconcileXpFromHistory(user);
  if (xpFromHistory != null) {
    xp = xpFromHistory;
    xpAdjusted = true;
  }

  return { coinsAdjusted, xpAdjusted, newCoins: coins, newXp: xp };
}
