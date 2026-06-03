import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { loseLife } from "@/lib/gamification-server";

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

  if (session!.user.id !== "admin-hardcoded") {
    const user = await User.findById(session!.user.id);
    if (user) {
      const premiumActive =
        user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());
      if (!isCorrect && !premiumActive) {
        loseLife(user);
      }
      await user.save();
    }
  }

  return NextResponse.json({
    isCorrect,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    xpEarned: 0,
    coinEarned: 0,
  });
}
