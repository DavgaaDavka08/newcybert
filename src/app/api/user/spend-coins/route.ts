import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { COIN_COSTS, type CoinSpendAction } from "@/lib/gamification";

type DailyField =
  | "dailyFreeAIUsed"
  | "dailyFreeProblemUsed"
  | "dailyFreeVideoUsed"
  | "dailyFreeExamUsed"
  | "dailyFreeEESUsed";

const DAILY_FREE: Record<string, { field: DailyField; limit: number }> = {
  ai_explanation: { field: "dailyFreeAIUsed", limit: 999 },
  correct_answer: { field: "dailyFreeProblemUsed", limit: 999 },
  solution_steps: { field: "dailyFreeProblemUsed", limit: 999 },
  hint: { field: "dailyFreeProblemUsed", limit: 999 },
  video_watch: { field: "dailyFreeVideoUsed", limit: 1 },
  exam_start: { field: "dailyFreeExamUsed", limit: 1 },
  ees_retake: { field: "dailyFreeEESUsed", limit: 1 },
};

function isToday(date: Date | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { action } = await req.json();
  const key = action as CoinSpendAction;
  const cost = COIN_COSTS[key];
  if (cost === undefined) {
    return NextResponse.json({ error: "Үл мэдэгдэх үйлдэл" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session!.user.id);
  if (!user) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  const premiumActive =
    user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

  if (premiumActive) {
    return NextResponse.json({ success: true, coins: user.coins, free: true, reason: "premium" });
  }

  if (!isToday(user.lastDailyReset)) {
    user.dailyFreeAIUsed = 0;
    user.dailyFreeProblemUsed = 0;
    user.dailyFreeVideoUsed = 0;
    user.dailyFreeExamUsed = 0;
    user.dailyFreeEESUsed = 0;
    user.lastDailyReset = new Date();
  }

  const dailyRule = DAILY_FREE[key];
  if (dailyRule) {
    const used: number = (user as Record<string, unknown>)[dailyRule.field] as number ?? 0;
    if (used < dailyRule.limit) {
      (user as Record<string, unknown>)[dailyRule.field] = used + 1;
      await user.save();
      return NextResponse.json({
        success: true,
        coins: user.coins,
        free: true,
        reason: "daily_free",
        remaining: dailyRule.limit - used - 1,
      });
    }
  }

  if (cost === 0) {
    return NextResponse.json({ success: true, coins: user.coins, free: true, reason: "free_action" });
  }

  if ((user.coins ?? 0) < cost) {
    return NextResponse.json(
      { error: "Зоос хүрэлцэхгүй байна", coins: user.coins, required: cost },
      { status: 402 },
    );
  }

  user.coins = (user.coins ?? 0) - cost;
  await user.save();

  return NextResponse.json({ success: true, coins: user.coins, spent: cost });
}
