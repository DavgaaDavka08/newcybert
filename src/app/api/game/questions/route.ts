// src/app/api/game/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const level = parseInt(searchParams.get("level") ?? "1");

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId шаардлагатай" }, { status: 400 });
  }

  await connectDB();
  const questions = await Question.find({ categoryId, level, isActive: true })
    .select("-correctIndex -explanation") // Hide answers from client initially
    .limit(10);

  if (!questions.length) {
    return NextResponse.json({ error: "Асуулт олдсонгүй" }, { status: 404 });
  }

  return NextResponse.json({ questions });
}
