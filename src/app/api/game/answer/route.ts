// src/app/api/game/answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { questionId, selectedIndex } = await req.json();

  await connectDB();

  const question = await Question.findById(questionId);
  if (!question) {
    return NextResponse.json({ error: "Асуулт олдсонгүй" }, { status: 404 });
  }

  const isCorrect = selectedIndex === question.correctIndex;
  const XP_PER_CORRECT = 5; // Зөв хариулт бүр +5 XP

  if (session!.user.id !== "admin-hardcoded") {
    const user = await User.findById(session!.user.id);
    if (user) {
      const premiumActive = user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());
      if (isCorrect) {
        // Premium: XP boost ×1.5
        const xp = premiumActive ? Math.round(XP_PER_CORRECT * 1.5) : XP_PER_CORRECT;
        user.xp = (user.xp ?? 0) + xp;
        user.level = Math.floor(user.xp / 200) + 1;
      } else {
        // Premium: амь хасахгүй
        if (!premiumActive) {
          user.lives = Math.max(0, (user.lives ?? 0) - 1);
        }
      }
      await user.save();
    }
  }

  return NextResponse.json({
    isCorrect,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    xpEarned: isCorrect ? XP_PER_CORRECT : 0,
    coinEarned: 0,
  });
}
