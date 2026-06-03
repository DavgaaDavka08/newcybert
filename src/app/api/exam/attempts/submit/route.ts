import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttemptModel } from '@/models/AttemptModel';
import { ExamModel } from '@/models/ExamModel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { User } from '@/models/User';
import { calcExamXp, calcExamCoins } from '@/lib/gamification';
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
  try {
    await connectDB();
    const { attemptId } = await req.json();

    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    if (attempt.isSubmitted) return NextResponse.json({ error: 'Шалгалт аль хэдийн дууссан байна!' }, { status: 400 });

    const exam = await ExamModel.findById(attempt.examId);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const total = exam.questions.length;
    let correctCount = 0;

    exam.questions.forEach((q: any) => {
      const ans = attempt.answers.find((a: any) => a.questionId === q.id);
      if (ans && ans.selectedOption === q.correctAnswer) correctCount++;
    });

    attempt.score = correctCount;
    attempt.totalQuestions = total;
    attempt.isSubmitted = true;
    attempt.finishedAt = new Date();
    await attempt.save();

    const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    const xpEarned = calcExamXp(percentage);
    const coinsEarned = calcExamCoins(percentage);

    let newXP = 0, newLevel = 1, newCoins = 0;

    try {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      if (userId && userId !== 'admin-hardcoded') {
        const user = await User.findById(userId);
        if (user) {
          const oldLevel = user.level ?? calcLevel(user.xp ?? 0);
          user.xp = (user.xp ?? 0) + xpEarned;
          user.coins = (user.coins ?? 0) + coinsEarned;
          resetXpPeriods(user, xpEarned);
          pushXpHistory(user, xpEarned, 'Шалгалт өгсөн');
          trackDailyQuest(user, 'exam');
          user.statsCounters = user.statsCounters ?? {};
          user.statsCounters.examsTaken = (user.statsCounters.examsTaken ?? 0) + 1;
          user.level = calcLevel(user.xp);
          applyLevelRewards(user, oldLevel, user.level);
          tryClaimDailyAllBonus(user);
          evaluateAchievements(user);
          await user.save();
          newXP    = user.xp;
          newLevel = user.level;
          newCoins = user.coins;
        }
      }
    } catch {
      // XP award failed — don't break submit response
    }

    return NextResponse.json({
      message: 'Шалгалт амжилттай илгээгдлээ',
      attemptId: attempt._id,
      score: correctCount,
      total,
      correctCount,
      wrongCount: total - correctCount,
      percentage,
      xpEarned,
      coinsEarned,
      newXP,
      newLevel,
      newCoins,
    });
  } catch (err: any) {
    console.error('[submit]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
