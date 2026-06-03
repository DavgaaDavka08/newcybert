import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { getXpProgress, ECONOMY_VERSION } from '@/lib/gamification';
import { syncLives, ensureLevelSynced } from '@/lib/gamification-server';
import { reconcileInflatedBalance } from '@/lib/economy-reconcile';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ xp: 0, level: 1, coins: 9999, lives: 99, streak: 0 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select(
      'xp level coins lives maxLives streak firstName lastName isPremium premiumUntil livesUpdatedAt dailyFreeAIUsed dailyFreeProblemUsed lastDailyReset economyVersion gameCompletedSubtopics gameCompletedTopics statsCounters xpHistory',
    );
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPremium =
      user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null;
    const isToday =
      lastReset &&
      lastReset.getFullYear() === new Date().getFullYear() &&
      lastReset.getMonth() === new Date().getMonth() &&
      lastReset.getDate() === new Date().getDate();
    const dailyAIUsed = isToday ? (user.dailyFreeAIUsed ?? 0) : 0;
    const dailyProblemUsed = isToday ? (user.dailyFreeProblemUsed ?? 0) : 0;

    const nextRefillAt = isPremium ? null : syncLives(user);

    if ((user.economyVersion ?? 0) < ECONOMY_VERSION) {
      const fix = reconcileInflatedBalance(user);
      if (fix.coinsAdjusted) user.coins = fix.newCoins;
      if (fix.xpAdjusted) user.xp = fix.newXp;
      user.economyVersion = ECONOMY_VERSION;
    }

    const xp = user.xp ?? 0;
    const level = ensureLevelSynced(user);
    await user.save();

    const progress = getXpProgress(xp);

    return NextResponse.json({
      xp,
      level,
      coins: user.coins ?? 0,
      lives: isPremium ? 99 : (user.lives ?? 5),
      maxLives: isPremium ? 99 : (user.maxLives ?? 5),
      nextRefillAt,
      streak: user.streak ?? 0,
      progress,
      name: `${user.firstName} ${user.lastName}`.trim(),
      isPremium,
      dailyFreeAIRemaining: isPremium ? 999 : Math.max(0, 3 - dailyAIUsed),
      dailyFreeProblemRemaining: isPremium ? 999 : Math.max(0, 20 - dailyProblemUsed),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
