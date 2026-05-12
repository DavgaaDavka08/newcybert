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

  // Update user stats (skip for admin)
  if (session!.user.id !== "admin-hardcoded") {
    const user = await User.findById(session!.user.id);
    if (user) {
      if (isCorrect) {
        user.xp    = (user.xp ?? 0) + question.xpReward;
        user.coins = (user.coins ?? 0) + question.coinReward;
        user.calculateLevel();
      } else {
        user.lives = Math.max(0, (user.lives ?? 0) - 1);
      }
      await user.save();
    }
  }

  return NextResponse.json({
    isCorrect,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    xpEarned:  isCorrect ? question.xpReward : 0,
    coinEarned: isCorrect ? question.coinReward : 0,
  });
}
