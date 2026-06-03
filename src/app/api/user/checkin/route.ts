import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { getStreakCoinReward, STREAK_COIN_REWARDS } from "@/lib/gamification";
import { calcLevel } from "@/lib/gamification-server";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function isYesterday(a: Date, b: Date) {
  const prev = new Date(b);
  prev.setDate(prev.getDate() - 1);
  return isSameDay(a, prev);
}

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const user = await User.findById(session!.user.id);
  if (!user) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  const now = new Date();
  const last = user.lastStreakDate ? new Date(user.lastStreakDate) : null;

  // Өнөөдөр аль хэдийн check-in хийсэн
  if (last && isSameDay(last, now)) {
    return NextResponse.json({
      alreadyDone: true,
      streak: user.streak,
      coins: user.coins,
    });
  }

  // Streak тасарсан эсэхийг шалгах
  const streakBroken = last && !isYesterday(last, now);
  if (streakBroken) {
    user.streak = 1; // Дахин эхлэнэ
  } else {
    user.streak = (user.streak ?? 0) + 1;
  }

  user.lastStreakDate = now;
  user.lastLoginDate  = now;

  const coinReward = getStreakCoinReward(user.streak);
  user.coins = (user.coins ?? 0) + coinReward;
  user.level = calcLevel(user.xp ?? 0);

  await user.save();

  const milestone = STREAK_COIN_REWARDS.find((r) => r.days === user.streak);

  return NextResponse.json({
    alreadyDone: false,
    streak: user.streak,
    coins: user.coins,
    coinReward,
    streakBroken,
    milestone: milestone ? { days: milestone.days, badge: milestone.badge } : null,
  });
}
