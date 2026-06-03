import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";

// Streak-ийн зоосны шагнал
const STREAK_REWARDS: { days: number; coins: number; badge?: string }[] = [
  { days: 1,  coins: 1 },
  { days: 3,  coins: 3 },
  { days: 7,  coins: 10, badge: "streak_7"  },
  { days: 30, coins: 50, badge: "streak_30" },
];

function getStreakReward(streak: number): number {
  let coins = 1;
  for (const r of STREAK_REWARDS) {
    if (streak >= r.days) coins = r.coins;
  }
  // 30+ өдөр: хамгийн их 50
  return Math.min(coins, 50);
}

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

  const coinReward = getStreakReward(user.streak);
  user.coins = (user.coins ?? 0) + coinReward;

  // XP premium boost
  const premiumActive = user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > now);
  const xpReward = premiumActive ? 15 : 10; // Premium: +15 XP/өдөр, Үнэгүй: +10 XP
  user.xp    = (user.xp ?? 0) + xpReward;
  user.level = Math.floor(user.xp / 200) + 1;

  await user.save();

  // Streak milestone
  const milestone = STREAK_REWARDS.find(r => r.days === user.streak);

  return NextResponse.json({
    alreadyDone: false,
    streak: user.streak,
    coins: user.coins,
    coinReward,
    xpReward,
    streakBroken,
    milestone: milestone ? { days: milestone.days, badge: milestone.badge } : null,
  });
}
