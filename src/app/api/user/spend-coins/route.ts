import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";

// ── Тогтмол үнэ ────────────────────────────────────────────────
export const COIN_COSTS: Record<string, number> = {
  exam_start:       0,   // эхний оролдлого үнэгүй
  exam_retake:      2,   // шалгалт дахин өгөх
  ees_retake:       2,   // ЕШ сорил дахин өгөх
  video_watch:      3,   // видео нээх
  pdf_download:    10,   // PDF татах
  ai_explanation:   3,   // AI тайлбар
  solution_steps:   2,   // алхамчилсан бодолт
  correct_answer:   1,   // зөв хариу харах
  full_heal:        5,   // амь бүрэн сэргээх
};

// ── Өдрийн үнэгүй хязгаар (free хэрэглэгч) ───────────────────
type DailyField =
  | "dailyFreeAIUsed"
  | "dailyFreeProblemUsed"
  | "dailyFreeVideoUsed"
  | "dailyFreeExamUsed"
  | "dailyFreeEESUsed";

const DAILY_FREE: Record<string, { field: DailyField; limit: number }> = {
  ai_explanation: { field: "dailyFreeAIUsed",      limit: 999 }, // Premium-ийн онцлог
  correct_answer: { field: "dailyFreeProblemUsed", limit: 999 },
  solution_steps: { field: "dailyFreeProblemUsed", limit: 999 },
  video_watch:    { field: "dailyFreeVideoUsed",   limit: 1   }, // Өдөрт 1 видео үнэгүй
  exam_start:     { field: "dailyFreeExamUsed",    limit: 1   }, // Өдөрт 1 шалгалт үнэгүй
  ees_retake:     { field: "dailyFreeEESUsed",     limit: 1   }, // Өдөрт 1 ЕШ сорил үнэгүй
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
  const cost = COIN_COSTS[action];
  if (cost === undefined) {
    return NextResponse.json({ error: "Үл мэдэгдэх үйлдэл" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session!.user.id);
  if (!user) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  const premiumActive =
    user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

  // Premium → бүгд үнэгүй
  if (premiumActive) {
    return NextResponse.json({ success: true, coins: user.coins, free: true, reason: "premium" });
  }

  // Өдрийн reset шалгах
  if (!isToday(user.lastDailyReset)) {
    user.dailyFreeAIUsed      = 0;
    user.dailyFreeProblemUsed = 0;
    user.dailyFreeVideoUsed   = 0;
    user.dailyFreeExamUsed    = 0;
    user.dailyFreeEESUsed     = 0;
    user.lastDailyReset = new Date();
  }

  // Өдрийн үнэгүй хязгаар шалгах
  const dailyRule = DAILY_FREE[action];
  if (dailyRule) {
    const used: number = (user as any)[dailyRule.field] ?? 0;
    if (used < dailyRule.limit) {
      (user as any)[dailyRule.field] = used + 1;
      await user.save();
      return NextResponse.json({
        success: true, coins: user.coins, free: true, reason: "daily_free",
        remaining: dailyRule.limit - used - 1,
      });
    }
  }

  // Үнэгүй action (exam_start)
  if (cost === 0) {
    return NextResponse.json({ success: true, coins: user.coins, free: true, reason: "free_action" });
  }

  // Зоос шалгах
  if ((user.coins ?? 0) < cost) {
    return NextResponse.json(
      { error: "Зоос хүрэлцэхгүй байна", coins: user.coins, required: cost },
      { status: 402 }
    );
  }

  user.coins = (user.coins ?? 0) - cost;
  await user.save();

  return NextResponse.json({ success: true, coins: user.coins, spent: cost });
}
