import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { calcEesXp, calcEesCoins } from '@/lib/gamification';
import {
  calcLevel,
  pushXpHistory,
  resetXpPeriods,
  applyLevelRewards,
  evaluateAchievements,
  tryClaimDailyAllBonus,
} from '@/lib/gamification-server';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { percent } = await req.json();
  const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const xpEarned = calcEesXp(pct);
  const coinsEarned = calcEesCoins(pct);

  await connectDB();
  const user = await User.findById(session!.user.id);
  if (!user) return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastEesRewardDate === today) {
    return NextResponse.json({
      alreadyRewarded: true,
      xp: user.xp,
      coins: user.coins,
      level: user.level ?? calcLevel(user.xp ?? 0),
      xpEarned: 0,
      coinsEarned: 0,
      percent: pct,
    });
  }

  const oldLevel = user.level ?? calcLevel(user.xp ?? 0);
  user.xp = (user.xp ?? 0) + xpEarned;
  user.coins = (user.coins ?? 0) + coinsEarned;
  user.lastEesRewardDate = today;
  resetXpPeriods(user, xpEarned);
  pushXpHistory(user, xpEarned, `ЕШ ${pct}%`);
  user.level = calcLevel(user.xp);
  const levelRewards = applyLevelRewards(user, oldLevel, user.level);
  const dailyBonusCoins = tryClaimDailyAllBonus(user);
  const newAchievements = evaluateAchievements(user);
  await user.save();

  return NextResponse.json({
    alreadyRewarded: false,
    xp: user.xp,
    coins: user.coins,
    level: user.level,
    xpEarned,
    coinsEarned,
    percent: pct,
    levelRewards,
    dailyBonusCoins,
    newAchievements,
  });
}
