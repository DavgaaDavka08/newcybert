import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { SubtopicModel } from '@/models/SubtopicModel';
import { requireAuth } from '@/lib/auth';
import {
  SUBTOPIC_XP_START,
  calcSubtopicCompleteXp,
  SUBTOPIC_COIN_COMPLETE,
  CATEGORY_COIN_COMPLETE,
  TOPIC_XP_BONUS,
} from '@/lib/gamification';
import {
  calcLevel,
  pushXpHistory,
  resetXpPeriods,
  trackDailyQuest,
  applyLevelRewards,
  evaluateAchievements,
  tryClaimDailyAllBonus,
} from '@/lib/gamification-server';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const subtopicId = String(body.subtopicId ?? '');
  const topicId = body.topicId ? String(body.topicId) : '';
  const passed = Boolean(body.passed);
  const perfect = Boolean(body.perfect);
  const awardStart = Boolean(body.awardStart);

  if (!subtopicId) {
    return NextResponse.json({ error: 'subtopicId шаардлагатай' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session!.user.id);
  if (!user) return NextResponse.json({ error: 'Хэрэглэгч олдсонгүй' }, { status: 404 });

  const completed: string[] = user.gameCompletedSubtopics ?? [];
  const topicsDone: string[] = user.gameCompletedTopics ?? [];
  const alreadyDone = completed.includes(subtopicId);

  let xpDelta = 0;
  let coinDelta = 0;
  const reasons: string[] = [];

  if (awardStart && !alreadyDone) {
    xpDelta += SUBTOPIC_XP_START;
    reasons.push('Сэдэв эхлэх');
  }

  if (passed && !alreadyDone) {
    const completeXp = calcSubtopicCompleteXp(perfect);
    xpDelta += completeXp;
    coinDelta += SUBTOPIC_COIN_COMPLETE;
    reasons.push(perfect ? '100% зөв + дуусгасан' : 'Сэдэв дуусгасан');
    completed.push(subtopicId);
    user.gameCompletedSubtopics = completed;
    user.statsCounters = user.statsCounters ?? {};
    user.statsCounters.topicsCompleted = (user.statsCounters.topicsCompleted ?? 0) + 1;
    trackDailyQuest(user, 'lesson');
  }

  let topicBonusCoins = 0;
  let topicBonusXp = 0;
  if (passed && !alreadyDone && topicId) {
    const topicOid = Types.ObjectId.isValid(topicId) ? new Types.ObjectId(topicId) : null;
    if (topicOid && !topicsDone.includes(topicId)) {
      const subs = await SubtopicModel.find({ topicId: topicOid, isActive: true }).select('_id').lean();
      const subIds = subs.map((s) => String(s._id));
      const allDone = subIds.length > 0 && subIds.every((id) => completed.includes(id));
      if (allDone) {
        topicBonusXp = TOPIC_XP_BONUS;
        topicBonusCoins = CATEGORY_COIN_COMPLETE;
        xpDelta += topicBonusXp;
        coinDelta += topicBonusCoins;
        topicsDone.push(topicId);
        user.gameCompletedTopics = topicsDone;
        reasons.push('Topic 100%');
      }
    }
  }

  if (xpDelta === 0 && coinDelta === 0) {
    return NextResponse.json({
      xp: user.xp,
      coins: user.coins,
      level: user.level ?? calcLevel(user.xp ?? 0),
      xpAdded: 0,
      coinsAdded: 0,
      alreadyCompleted: alreadyDone,
      message: alreadyDone ? 'Энэ сэдвийг өмнө нь дуусгасан' : 'Шагнал олгоогүй',
    });
  }

  const oldLevel = user.level ?? calcLevel(user.xp ?? 0);
  user.xp = (user.xp ?? 0) + xpDelta;
  user.coins = (user.coins ?? 0) + coinDelta;
  resetXpPeriods(user, xpDelta);
  pushXpHistory(user, xpDelta, reasons.join(' · ') || 'Сэдэв');
  user.level = calcLevel(user.xp);
  const levelRewards = applyLevelRewards(user, oldLevel, user.level);
  const dailyBonusCoins = tryClaimDailyAllBonus(user);
  const newAchievements = evaluateAchievements(user);
  await user.save();

  return NextResponse.json({
    xp: user.xp,
    coins: user.coins,
    level: user.level,
    xpAdded: xpDelta,
    coinsAdded: coinDelta,
    topicBonusCoins,
    levelRewards,
    dailyBonusCoins,
    newAchievements,
    alreadyCompleted: false,
    breakdown: { start: awardStart && !alreadyDone ? SUBTOPIC_XP_START : 0, complete: passed && !alreadyDone ? calcSubtopicCompleteXp(perfect) : 0 },
  });
}
