import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import {
  getXpProgress,
  LEVEL_REWARDS,
  DAILY_QUESTS,
  DAILY_ALL_BONUS_COINS,
  COIN_VIDEO_UNLOCK,
  getNextLevelReward,
} from '@/lib/gamification';
import {
  syncLives,
  formatAchievements,
  ensureDailyQuests,
  calcLevel,
} from '@/lib/gamification-server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ demo: true });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPremium =
      user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

    ensureDailyQuests(user);
    const nextRefillAt = isPremium ? null : syncLives(user);
    await user.save();

    const xp = user.xp ?? 0;
    const progress = getXpProgress(xp);
    const dq = user.dailyQuests ?? {};
    const quests = DAILY_QUESTS.filter((q) => q.id !== 'all_bonus').map((q) => {
      let done = false;
      let current = 0;
      let target = 1;
      if (q.id === 'video') done = Boolean(dq.video);
      if (q.id === 'exam') done = Boolean(dq.exam);
      if (q.id === 'lesson') {
        current = dq.questions ?? 0;
        target = q.target ?? 1;
        done = current >= target;
      }
      return { ...q, done, current, target };
    });
    const allQuestsDone = quests.every((q) => q.done);

    return NextResponse.json({
      xp,
      level: user.level ?? calcLevel(xp),
      coins: user.coins ?? 0,
      lives: isPremium ? 99 : (user.lives ?? 5),
      maxLives: isPremium ? 99 : (user.maxLives ?? 5),
      nextRefillAt,
      streak: user.streak ?? 0,
      isPremium,
      progress,
      xpHistory: (user.xpHistory ?? []).slice(0, 8),
      levelRewards: LEVEL_REWARDS,
      nextLevelReward: getNextLevelReward(progress.level),
      dailyQuests: quests,
      dailyAllBonus: { coins: DAILY_ALL_BONUS_COINS, done: allQuestsDone, claimed: Boolean(dq.allClaimed) },
      achievements: formatAchievements(user),
      stats: user.statsCounters ?? {},
      coinGoal: {
        target: COIN_VIDEO_UNLOCK,
        current: user.coins ?? 0,
        remaining: Math.max(0, COIN_VIDEO_UNLOCK - (user.coins ?? 0)),
        label: 'Дараагийн видео нээх',
      },
      dailyXp: user.dailyXp ?? 0,
      weeklyXp: user.weeklyXp ?? 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
