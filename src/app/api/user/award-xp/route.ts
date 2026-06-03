import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import {
  VIDEO_XP_HALF,
  VIDEO_XP_FULL,
  VIDEO_XP_QUIZ,
  DAILY_QUESTS,
} from '@/lib/gamification';
import {
  calcLevel,
  applyLevelRewards,
  pushXpHistory,
  resetXpPeriods,
  trackDailyQuest,
  tryClaimDailyAllBonus,
  evaluateAchievements,
} from '@/lib/gamification-server';

/** Клиентоос дурын XP/зоос илгээхийг хориглоно — зөвхөн серверийн action */
const XP_ACTIONS: Record<string, { xp: number; coins: number; questKind?: 'video' | 'exam' | 'question' }> = {
  video_half: { xp: VIDEO_XP_HALF, coins: 0, questKind: 'video' },
  video_full: { xp: VIDEO_XP_FULL, coins: 0, questKind: 'video' },
  video_quiz: { xp: VIDEO_XP_QUIZ, coins: 0, questKind: 'video' },
  daily_video: { xp: DAILY_QUESTS.find((q) => q.id === 'video')?.xp ?? 3, coins: 0, questKind: 'video' },
  daily_exam: { xp: DAILY_QUESTS.find((q) => q.id === 'exam')?.xp ?? 3, coins: 0, questKind: 'exam' },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === 'admin-hardcoded') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action ?? '');
    const reward = XP_ACTIONS[action];
    if (!reward) {
      return NextResponse.json(
        { error: 'Зөвшөөрөгдөөгүй action. xp/coins шууд илгээх боломжгүй.' },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const xpDelta = reward.xp;
    const coinDelta = reward.coins;
    const reason = String(body.reason ?? action);

    const oldLevel = user.level ?? calcLevel(user.xp ?? 0);
    user.xp = (user.xp ?? 0) + xpDelta;
    user.coins = (user.coins ?? 0) + coinDelta;
    resetXpPeriods(user, xpDelta);
    if (xpDelta) pushXpHistory(user, xpDelta, reason);

    if (reward.questKind === 'video') trackDailyQuest(user, 'video');
    if (reward.questKind === 'exam') trackDailyQuest(user, 'exam');
    if (reward.questKind === 'question') {
      trackDailyQuest(user, 'question');
      user.statsCounters = user.statsCounters ?? {};
      user.statsCounters.questionsAnswered = (user.statsCounters.questionsAnswered ?? 0) + 1;
    }

    user.level = calcLevel(user.xp);
    const levelRewards = applyLevelRewards(user, oldLevel, user.level);
    const bonusCoins = tryClaimDailyAllBonus(user);
    const newAchievements = evaluateAchievements(user);

    await user.save();

    return NextResponse.json({
      xp: user.xp,
      coins: user.coins,
      level: user.level,
      xpAdded: xpDelta,
      coinsAdded: coinDelta,
      levelRewards,
      dailyBonusCoins: bonusCoins,
      newAchievements,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
